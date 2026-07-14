import re
from collections.abc import Callable
from dataclasses import dataclass
from typing import Any


@dataclass
class TemplateParserConfig:
    pattern: str = r"\{\{\s*((?:params|correct_answers)\.[a-zA-Z_]\w*(?:\.[a-zA-Z_]\w*)*)\s*\}\}"  ## Finds any {{params.value}} or {{correct_answers.value}} and even nested {{params.value.nested}}
    strict: bool = False  # raise on missing key
    keep_unknown: bool = True  # keep token if missing (if not strict)
    stringify: Callable[[Any], str] = str  # custom value formatter


class TemplateParser:
    def __init__(
        self,
        config: TemplateParserConfig | None = None,
    ) -> None:
        if not config:
            config = TemplateParserConfig()
        self.config = config
        self.regex = re.compile(self.config.pattern)

    def render(self, template: str, data: dict[str, Any]):
        def replacer(match: re.Match) -> str:
            path: str = match.group(1)  # captured path, e.g. "params.name"
            found, value = self._get_nested(data, path)
            if not found:
                if self.config.strict:
                    raise KeyError(f"Missing template value for path: {path}")
                if self.config.keep_unknown:
                    return match.group(0)
                return ""

            return self.config.stringify(value)

        return self.regex.sub(replacer, template)

    def _get_nested(self, data: dict[str, str], path: str) -> tuple[bool, Any]:
        cur = data
        for part in path.split("."):
            if isinstance(cur, dict) and part in cur:
                cur = cur.get(part)
            else:
                return False, None
        return True, cur


if __name__ == "__main__":
    quiz_data = {
        "params": {
            "a": 5,
            "b": 10,
            "x_num": 3,
            "x_den": 4,
            "alpha": "x+1",
            "beta": "2x-3",
            "nested": {"label": "value-from-nested-path"},
        },
        "correct_answers": {
            "sum": 15,
            "product": 50,
            "nested": {"value": 10},
        },
    }
    html = r"""
    <pl-question-panel>
    <p>What is {{params.a}} + {{params.b}}?</p>
    <p>Nested string: {{params.nested.label}}</p>
    <p>Nested answer value: {{correct_answers.nested.value}}</p>

    <p>Missing value should remain unchanged: {{params.missing_value}}</p>

    <p>Inline latex: ${{params.a}}x + {{params.b}}$</p>
    <p>Inline latex with braces: $\frac{{{{params.x_num}}}}{{{{params.x_den}}}}$</p>
    <p>Block latex: $$f(x) = {{{params.alpha}}} + {{{params.beta}}}$$</p>

    <pl-answer correct_answer="{{correct_answers.sum}}"></pl-answer>
    </pl-question-panel>
    """

    def my_custom_stringify(val: Any) -> str:
        if isinstance(val, (str, int, float, bool)):
            return str(val)
        if isinstance(val, list):
            return "\n".join(str(x) for x in val)
        raise TypeError(f"Unsupported type: {type(val).__name__}")

    templater = TemplateParser(
        config=TemplateParserConfig(stringify=my_custom_stringify)
    )
    print("TGemplate")
    print(templater.render(html, quiz_data))
