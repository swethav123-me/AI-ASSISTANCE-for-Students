"""
Agent registry - central place to access all agents, similar to CrewAI's Crew.
Orchestrates task assignment to the appropriate agent.
"""
from app.agents.research_agent import research_agent
from app.agents.note_agent import notes_agent
from app.agents.assignment_agent import assignment_agent
from app.agents.quiz_agent import quiz_agent
from app.agents.coding_agent import coding_agent
from app.agents.career_agent import career_agent
from app.agents.revision_agent import revision_agent
from app.agents.timetable_agent import timetable_agent
from app.models.chat import AgentType

agents_map = {
    AgentType.research: research_agent,
    AgentType.notes: notes_agent,
    AgentType.assignment: assignment_agent,
    AgentType.quiz: quiz_agent,
    AgentType.coding: coding_agent,
    AgentType.career: career_agent,
    AgentType.revision: revision_agent,
    AgentType.timetable: timetable_agent,
}


def get_agent(agent_type: AgentType):
    agent = agents_map.get(agent_type)
    if not agent:
        raise ValueError(f"Unknown agent type: {agent_type}")
    return agent


def list_agents() -> list[dict]:
    return [
        {
            "type": agent_type.value,
            "name": agent.name,
            "role": agent.role,
            "goal": agent.goal,
            "backstory": agent.backstory,
        }
        for agent_type, agent in agents_map.items()
    ]