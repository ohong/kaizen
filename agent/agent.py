"""
This is the main entry point for the agent.
It defines the workflow graph, state, tools, nodes and edges.
"""

import json
import os
from typing import Any, List

import requests
from typing_extensions import Literal
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, BaseMessage
from langchain_core.runnables import RunnableConfig
from langchain.tools import tool
from langgraph.graph import StateGraph, END
from langgraph.types import Command
from langgraph.graph import MessagesState
from langgraph.prebuilt import ToolNode

class AgentState(MessagesState):
    """
    Here we define the state of the agent

    In this instance, we're inheriting from CopilotKitState, which will bring in
    the CopilotKitState fields. We're also adding a custom field, `language`,
    which will be used to set the language of the agent.
    """
    proverbs: List[str] = []
    tools: List[Any]
    # your_custom_agent_state: str = ""

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

FORBIDDEN_SQL_KEYWORDS = {
    "insert",
    "update",
    "delete",
    "drop",
    "alter",
    "truncate",
    "grant",
    "revoke",
}


def _ensure_supabase_env() -> None:
    if not SUPABASE_URL:
        raise RuntimeError(
            "Supabase SQL tool requires NEXT_PUBLIC_SUPABASE_URL to be set."
        )
    if not SUPABASE_SERVICE_ROLE_KEY:
        raise RuntimeError(
            "Supabase SQL tool requires SUPABASE_SERVICE_ROLE_KEY to be set."
        )


def _sanitize_query(query: str) -> str:
    cleaned = query.strip()
    if not cleaned:
        raise ValueError("Query must not be empty.")

    # Strip trailing semicolon if present (common in SQL syntax)
    if cleaned.endswith(";"):
        cleaned = cleaned[:-1].strip()

    # Check for remaining semicolons (multiple statements)
    if ";" in cleaned:
        raise ValueError("Multiple SQL statements are not allowed.")

    lowered = cleaned.lower()
    if not lowered.startswith("select"):
        raise ValueError("Only SELECT statements are permitted for Supabase SQL tool.")

    if any(keyword in lowered for keyword in FORBIDDEN_SQL_KEYWORDS):
        raise ValueError("Potentially destructive SQL detected; query blocked.")

    return cleaned


def _execute_supabase_query(sql: str) -> List[Any]:
    _ensure_supabase_env()
    endpoint = f"{SUPABASE_URL}/rest/v1/rpc/run_sql"
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }

    try:
        response = requests.post(
            endpoint,
            headers=headers,
            json={"query": sql},
            timeout=30,
        )
    except requests.RequestException as exc:
        raise RuntimeError("Supabase SQL request failed to execute.") from exc

    if response.status_code >= 400:
        try:
            payload = response.json()
        except ValueError:
            payload = {"message": response.text}
        raise RuntimeError(f"Supabase SQL error: {payload}")

    try:
        data = response.json()
    except ValueError as exc:
        raise RuntimeError("Supabase SQL returned a non-JSON payload.") from exc

    if data is None:
        return []

    if isinstance(data, list):
        return data

    return [data]


@tool
def run_supabase_sql(query: str) -> str:
    """Execute a read-only SQL SELECT query against Supabase analytics tables and return JSON results."""

    sanitized = _sanitize_query(query)
    rows = _execute_supabase_query(sanitized)

    if not rows:
        return "[]"

    return json.dumps(rows, indent=2, default=str)

# @tool
# def your_tool_here(your_arg: str):
#     """Your tool description here."""
#     print(f"Your tool logic here")
#     return "Your tool response here."

backend_tools = [
    run_supabase_sql
    # your_tool_here
]

# Extract tool names from backend_tools for comparison
backend_tool_names = [tool.name for tool in backend_tools]


async def chat_node(state: AgentState, config: RunnableConfig) -> Command[Literal["tool_node", "__end__"]]:
    """
    Standard chat node based on the ReAct design pattern. It handles:
    - The model to use (and binds in CopilotKit actions and the tools defined above)
    - The system prompt
    - Getting a response from the model
    - Handling tool calls

    For more about the ReAct design pattern, see:
    https://www.perplexity.ai/search/react-agents-NcXLQhreS0WDzpVaS4m9Cg
    """

    # 1. Define the model
    model = ChatOpenAI(model="gpt-4o")

    # 2. Bind the tools to the model
    model_with_tools = model.bind_tools(
        [
            *state.get("tools", []), # bind tools defined by ag-ui
            *backend_tools,
            # your_tool_here
        ],

        # 2.1 Disable parallel tool calls to avoid race conditions,
        #     enable this for faster performance if you want to manage
        #     the complexity of running tool calls in parallel.
        parallel_tool_calls=False,
    )

    # 3. Define the system message by which the chat model will be run
    system_message = SystemMessage(
        content=(
            "You are Kaizen's delivery analytics copilot. Use Supabase's run_supabase_sql tool for data-driven "
            "answers and rely on the GitHub MCP tools surfaced by the runtime to inspect repository activity. "
            "Keep responses concise, note relevant metrics, and explain how the data supports your answer."
        )
    )

    # 4. Run the model to generate a response
    response = await model_with_tools.ainvoke([
        system_message,
        *state["messages"],
    ], config)

    # only route to tool node if tool is not in the tools list
    if route_to_tool_node(response):
        print("routing to tool node")
        return Command(
            goto="tool_node",
            update={
                "messages": [response],
            }
        )

    # 5. We've handled all tool calls, so we can end the graph.
    return Command(
        goto=END,
        update={
            "messages": [response],
        }
    )

def route_to_tool_node(response: BaseMessage):
    """
    Route to tool node if any tool call in the response matches a backend tool name.
    """
    tool_calls = getattr(response, "tool_calls", None)
    if not tool_calls:
        return False

    for tool_call in tool_calls:
        if tool_call.get("name") in backend_tool_names:
            return True
    return False

# Define the workflow graph
workflow = StateGraph(AgentState)
workflow.add_node("chat_node", chat_node)
workflow.add_node("tool_node", ToolNode(tools=backend_tools))
workflow.add_edge("tool_node", "chat_node")
workflow.set_entry_point("chat_node")

graph = workflow.compile()
