# Agent Implementation Patterns

Practical patterns for implementing, optimizing, testing, and migrating agents.

**Related:** [Agent Design Guide](./agent-design-guide.md) - Core principles and structure

---

## Advanced Tool Patterns

### Parallel Tool Execution

When multiple independent operations are needed:

```xml
<workflow>
1. Gather data (parallel)
   `Read package.json` + `Read tsconfig.json` + `Glob src/**/*.ts`
   → Combine results

2. Validate all inputs (parallel)
   Check package.json structure + Check tsconfig validity + Count TS files
   → Ensure all pass

3. Proceed with analysis
   Use gathered data for insights
</workflow>
```

### Error Recovery Patterns

Design agents to handle failures gracefully:

```xml
<critical_thinking>
Error recovery:
- If file not found → Check alternate locations before failing
- If validation fails → Return partial results + specific failure reason
- If tool times out → Retry with smaller scope

Graceful degradation:
- Primary source unavailable → Use fallback data
- Parse error → Return raw data + error context
- Incomplete data → Process what's available + flag gaps
</critical_thinking>
```

### Conditional Workflows

For agents that adapt based on findings:

```xml
<workflow>
1. Initial scan
   `Glob **/*.test.ts` → test_files[]

2. Branch based on findings
   If test_files.length > 0:
     - Run test analysis workflow
   Else:
     - Return "no tests found" + setup recommendations

3. Adapt output format
   Match output to what was actually found
</workflow>
```

---

## Performance Optimization

### Token Budget Management

Track and optimize token usage:

1. **Measure baseline**: Count tokens in current prompt
2. **Identify waste**: Look for repetition, verbosity, unused sections
3. **Compress**: Replace prose with tables, remove filler words
4. **Validate**: Test that compressed version works equally well

### Caching Strategies

For agents that process similar inputs repeatedly:

```xml
<context>
Design for prompt caching:
- Put static instructions at the start (cached)
- Put variable data at the end (not cached)
- Group related static content together
</context>
```

### Batch Processing

When processing multiple items:

```xml
<workflow>
Batch approach (efficient):
1. Collect all items to process
2. Process in single pass
3. Return aggregated results

Avoid (inefficient):
- Processing one item per agent invocation
- Multiple round trips for similar operations
</workflow>
```

---

## Testing Agent Designs

### Validation Checklist

Before deploying an agent:

1. **Unit test the agent**
   - Test with valid inputs → expected outputs
   - Test with invalid inputs → proper error handling
   - Test edge cases → graceful handling

2. **Integration test with skill**
   - Verify skill → agent communication
   - Check quality gate enforcement
   - Confirm retry logic works

3. **Token efficiency test**
   - Measure actual token usage
   - Compare against budget targets
   - Optimize if exceeding limits

4. **Security audit**
   - Review tool grants (minimal necessary)
   - Check file path restrictions
   - Verify no sensitive data in prompts

### Test Data Patterns

Create realistic test scenarios:

```markdown
# Test Case 1: Happy Path
Input: Valid skill file with all required sections
Expected: Pass validation, no errors

# Test Case 2: Missing Section
Input: Skill file without workflow section
Expected: Fail validation, specific error about missing workflow

# Test Case 3: Malformed Content
Input: Skill file with broken YAML frontmatter
Expected: Fail validation, YAML syntax error reported

# Test Case 4: Edge Case
Input: Skill file with maximum allowed size (500 lines)
Expected: Pass validation if content is valid
```

---

## Migration Patterns

### Converting Skills to Agents

When extracting agent-worthy logic from a skill:

1. **Identify extraction candidate**
   - Single-purpose, reusable logic
   - Clear input/output contract
   - No user interaction required

2. **Extract to agent**
   - Create agent file in `agents/`
   - Define YAML frontmatter with tools
   - Structure as XML with all required tags

3. **Update skill to use agent**
   - Replace inline logic with Task tool call
   - Add quality gate for agent output
   - Handle agent errors appropriately

4. **Test both in isolation**
   - Agent works standalone
   - Skill orchestrates correctly
   - End-to-end workflow functions

### Refactoring Oversized Agents

When an agent grows beyond its responsibility:

1. **Identify distinct responsibilities**
   - List all tasks the agent performs
   - Group related tasks
   - Find natural split points

2. **Create focused agents**
   - One agent per responsibility group
   - Each with clear SRP
   - Minimal overlap

3. **Create orchestrating skill**
   - Skill coordinates the agents
   - Handles workflow logic
   - Applies combined quality gates

---

## See Also

- **[Agent Design Guide](./agent-design-guide.md)** - Core principles and structure
- **[Agent Configuration Guide](./agent-configuration.md)** - YAML frontmatter and tool configuration
- **[Agent Advanced Patterns](./agent-advanced-patterns.md)** - Resumption, anti-patterns, and prompt writing
