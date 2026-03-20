import json
import os
import re

from dotenv import load_dotenv

load_dotenv()

SYSTEM_PROMPT = """You are an expert sales call analyzer. Analyze the provided call transcript and return a JSON object with EXACTLY this structure — no markdown, no explanation, just the raw JSON:
{
  "overall_score": <float 0-10>,
  "sentiment": "<Positive|Neutral|Negative>",
  "summary": "<2-3 sentence summary of the call>",
  "agent_talk_time_percent": <float, estimate percentage 0-100>,
  "customer_talk_time_percent": <float, remaining percentage>,
  "communication_clarity_score": <float 1-10>,
  "politeness_score": <float 1-10>,
  "business_knowledge_score": <float 1-10>,
  "problem_handling_score": <float 1-10>,
  "listening_ability_score": <float 1-10>,
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "action_items": ["action item 1", "action item 2", "action item 3"],
  "positive_observations": ["observation 1", "observation 2"],
  "negative_observations": ["observation 1", "observation 2"],
  "questionnaire_coverage": {
    "Budget Discussion": true,
    "Competitor Comparison": false,
    "Product/Service Fit": true,
    "Timeline Discussion": false,
    "Decision Maker Identified": true,
    "Pain Points Explored": true,
    "Next Steps Agreed": false
  }
}
"""


def _extract_json(text: str) -> str:
    text = text.strip()
    fence = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
    if fence:
        return fence.group(1).strip()
    return text


def analyze_call(transcript: str) -> dict:
    from openai import OpenAI

    api_key = (os.getenv("OPENAI_API_KEY") or "").strip()
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is missing in backend environment")
    client = OpenAI(api_key=api_key)
    user_message = f"Analyze this sales call transcript:\n\n{transcript}"

    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    completion = client.chat.completions.create(
        model=model,
        max_tokens=4096,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
    )
    raw = ""
    if completion.choices:
        raw = completion.choices[0].message.content or ""

    try:
        return json.loads(_extract_json(raw))
    except json.JSONDecodeError:
        return {
            "overall_score": 0.0,
            "sentiment": "Neutral",
            "summary": "Analysis could not be parsed. Raw model output was invalid JSON.",
            "agent_talk_time_percent": 50.0,
            "customer_talk_time_percent": 50.0,
            "communication_clarity_score": 5.0,
            "politeness_score": 5.0,
            "business_knowledge_score": 5.0,
            "problem_handling_score": 5.0,
            "listening_ability_score": 5.0,
            "keywords": [],
            "action_items": [],
            "positive_observations": [],
            "negative_observations": [],
            "questionnaire_coverage": {},
        }
