# SPDX-FileCopyrightText: 2025-2026 Qodeca sp. z o.o.
# SPDX-License-Identifier: GPL-3.0-only
"""Minimal stdlib JSON Schema 2020-12 validator.

Subset supported (covers brand.schema.json exhaustively):
  type (string or array), required, properties, additionalProperties (bool|schema),
  items, pattern, minLength, maxLength, enum, const, oneOf,
  minimum, maximum, minItems, maxItems, minProperties, maxProperties.

Returns list of "<path>: <msg>" errors. Empty list = valid.

Metadata keywords ($schema, $id, $comment, title, description, examples, default)
are silently ignored — they carry no constraint information.

This is intentionally a subset. If a future schema needs $ref, if/then/else,
allOf/anyOf, dependentSchemas, or remote schema loading, vendor jsonschema instead.
"""
import re
from typing import Any, List, Union

_TYPE_MAP = {
    "string": (str,),
    "integer": (int,),
    "number": (int, float),
    "object": (dict,),
    "array": (list,),
    "boolean": (bool,),
    "null": (type(None),),
}


def _check_type(instance: Any, t: str) -> bool:
    py = _TYPE_MAP.get(t)
    if py is None:
        return False
    if t in ("integer", "number") and isinstance(instance, bool):
        return False  # bool is a subclass of int in Python; reject for numeric types
    if t == "boolean":
        return isinstance(instance, bool)
    if t == "integer":
        return isinstance(instance, int) and not isinstance(instance, bool)
    return isinstance(instance, py)


def validate(instance: Any, schema: dict, path: str = "$") -> List[str]:
    errors: List[str] = []
    if not isinstance(schema, dict):
        return errors

    if "type" in schema:
        expected = schema["type"]
        expected_list = [expected] if isinstance(expected, str) else list(expected)
        if not any(_check_type(instance, t) for t in expected_list):
            errors.append(
                f"{path}: expected type {expected}, got {type(instance).__name__}"
            )
            return errors

    if "enum" in schema and instance not in schema["enum"]:
        errors.append(f"{path}: value {instance!r} not in enum {schema['enum']}")

    if "const" in schema and instance != schema["const"]:
        errors.append(f"{path}: expected const {schema['const']!r}, got {instance!r}")

    if "oneOf" in schema:
        matches = []
        sub_errors_per_branch = []
        for i, sub in enumerate(schema["oneOf"]):
            sub_e = validate(instance, sub, f"{path}<oneOf[{i}]>")
            if not sub_e:
                matches.append(i)
            sub_errors_per_branch.append((i, sub_e))
        if len(matches) == 0:
            errors.append(
                f"{path}: matched 0 of {len(schema['oneOf'])} oneOf branches"
            )
            for i, sub_e in sub_errors_per_branch:
                for e in sub_e[:1]:
                    errors.append(f"  branch[{i}]: {e}")
        elif len(matches) > 1:
            errors.append(
                f"{path}: matched {len(matches)} of {len(schema['oneOf'])} oneOf branches (expected exactly 1)"
            )

    if "anyOf" in schema:
        any_matched = False
        sub_errors_per_branch = []
        for i, sub in enumerate(schema["anyOf"]):
            sub_e = validate(instance, sub, f"{path}<anyOf[{i}]>")
            if not sub_e:
                any_matched = True
                break
            sub_errors_per_branch.append((i, sub_e))
        if not any_matched:
            errors.append(
                f"{path}: matched 0 of {len(schema['anyOf'])} anyOf branches"
            )
            for i, sub_e in sub_errors_per_branch:
                for e in sub_e[:1]:
                    errors.append(f"  branch[{i}]: {e}")

    if isinstance(instance, str):
        if "minLength" in schema and len(instance) < schema["minLength"]:
            errors.append(
                f"{path}: string length {len(instance)} < minLength {schema['minLength']}"
            )
        if "maxLength" in schema and len(instance) > schema["maxLength"]:
            errors.append(
                f"{path}: string length {len(instance)} > maxLength {schema['maxLength']}"
            )
        if "pattern" in schema and not re.search(schema["pattern"], instance):
            errors.append(
                f"{path}: string {instance!r} does not match pattern {schema['pattern']!r}"
            )

    if isinstance(instance, (int, float)) and not isinstance(instance, bool):
        if "minimum" in schema and instance < schema["minimum"]:
            errors.append(f"{path}: number {instance} < minimum {schema['minimum']}")
        if "maximum" in schema and instance > schema["maximum"]:
            errors.append(f"{path}: number {instance} > maximum {schema['maximum']}")

    if isinstance(instance, list):
        if "items" in schema:
            for i, item in enumerate(instance):
                errors.extend(validate(item, schema["items"], f"{path}[{i}]"))
        if "minItems" in schema and len(instance) < schema["minItems"]:
            errors.append(
                f"{path}: array length {len(instance)} < minItems {schema['minItems']}"
            )
        if "maxItems" in schema and len(instance) > schema["maxItems"]:
            errors.append(
                f"{path}: array length {len(instance)} > maxItems {schema['maxItems']}"
            )

    if isinstance(instance, dict):
        properties = schema.get("properties", {})
        required = schema.get("required", [])
        additional = schema.get("additionalProperties", True)

        for k in required:
            if k not in instance:
                errors.append(f"{path}: missing required property {k!r}")

        for k, v in instance.items():
            sub_path = f"{path}.{k}"
            if k in properties:
                errors.extend(validate(v, properties[k], sub_path))
            else:
                if additional is False:
                    errors.append(
                        f"{path}: unexpected additional property {k!r}"
                    )
                elif isinstance(additional, dict):
                    errors.extend(validate(v, additional, sub_path))

        if "minProperties" in schema and len(instance) < schema["minProperties"]:
            errors.append(
                f"{path}: object has {len(instance)} properties, minProperties is {schema['minProperties']}"
            )
        if "maxProperties" in schema and len(instance) > schema["maxProperties"]:
            errors.append(
                f"{path}: object has {len(instance)} properties, maxProperties is {schema['maxProperties']}"
            )

    return errors
