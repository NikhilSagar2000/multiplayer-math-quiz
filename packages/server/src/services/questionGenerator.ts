type Operator = '+' | '-' | '*' | '/';

interface GeneratedQuestion {
  expression: string;
  answer: number;
}

const OPERATORS: Operator[] = ['+', '-', '*', '/'];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomOperator(): Operator {
  return OPERATORS[Math.floor(Math.random() * OPERATORS.length)];
}

/**
 * Safe expression evaluator using recursive descent parsing.
 * Handles +, -, *, / with correct BODMAS precedence and parentheses.
 */
function evaluateExpression(expr: string): number {
  let pos = 0;
  const str = expr.replace(/\s/g, '');

  function parseExpression(): number {
    let result = parseTerm();
    while (pos < str.length && (str[pos] === '+' || str[pos] === '-')) {
      const op = str[pos++];
      const term = parseTerm();
      result = op === '+' ? result + term : result - term;
    }
    return result;
  }

  function parseTerm(): number {
    let result = parseFactor();
    while (pos < str.length && (str[pos] === '*' || str[pos] === '/')) {
      const op = str[pos++];
      const factor = parseFactor();
      result = op === '*' ? result * factor : result / factor;
    }
    return result;
  }

  function parseFactor(): number {
    if (str[pos] === '(') {
      pos++; // skip '('
      const result = parseExpression();
      pos++; // skip ')'
      return result;
    }

    // Handle negative numbers
    let negative = false;
    if (str[pos] === '-') {
      negative = true;
      pos++;
    }

    let numStr = '';
    while (pos < str.length && str[pos] >= '0' && str[pos] <= '9') {
      numStr += str[pos++];
    }
    const num = parseInt(numStr, 10);
    return negative ? -num : num;
  }

  return parseExpression();
}

/**
 * Build a random BODMAS expression with 2-4 operations.
 * Randomly adds parentheses for complexity.
 */
function buildExpression(): { expression: string; answer: number } {
  const numOps = randomInt(2, 4);
  const numbers: number[] = [];
  const operators: Operator[] = [];

  for (let i = 0; i <= numOps; i++) {
    numbers.push(randomInt(1, 50));
  }
  for (let i = 0; i < numOps; i++) {
    operators.push(randomOperator());
  }

  // Build expression parts
  const parts: string[] = [numbers[0].toString()];
  for (let i = 0; i < operators.length; i++) {
    parts.push(operators[i]);
    parts.push(numbers[i + 1].toString());
  }

  // Randomly add one set of parentheses (50% chance) to make it interesting
  if (numOps >= 2 && Math.random() > 0.5) {
    // Pick a random sub-expression to wrap in parentheses
    // e.g., for "a + b * c - d", wrap "b * c" or "a + b"
    const start = randomInt(0, numOps - 1); // operator index to start wrapping
    const startIdx = start * 2; // position in parts array (number before operator)
    const endIdx = startIdx + 2; // position in parts array (number after operator)

    parts[startIdx] = '(' + parts[startIdx];
    parts[endIdx] = parts[endIdx] + ')';
  }

  const expression = parts.join(' ');
  const answer = evaluateExpression(expression);

  return { expression, answer };
}

/**
 * Generate a question with a valid positive integer answer.
 * Retries if the answer is not a positive integer.
 */
export function generateQuestion(): GeneratedQuestion {
  const MAX_ATTEMPTS = 100;

  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const { expression, answer } = buildExpression();

    // Must be a positive integer
    if (Number.isInteger(answer) && answer > 0 && Number.isFinite(answer)) {
      return { expression, answer };
    }
  }

  // Fallback: simple addition
  const a = randomInt(1, 50);
  const b = randomInt(1, 50);
  return { expression: `${a} + ${b}`, answer: a + b };
}

// Export for testing
export { evaluateExpression };
