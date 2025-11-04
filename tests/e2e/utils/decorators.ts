import { formatParameterValue, toTitleCase } from './format';

import { addTestStep } from './bug-reporter';
import { test as base } from '@playwright/test';

/**
 * Decorator that wraps POM methods to create Playwright test steps.
 * Automatically formats method names to readable step titles and tracks steps for bug reporting.
 *
 * @param target - The method being decorated
 * @param context - Decorator context containing method metadata
 */
export function Step<This, Arguments extends unknown[], Return>(
  target: (this: This, ...arguments_: Arguments) => Promise<Return>,
  context: ClassMethodDecoratorContext<
    This,
    (this: This, ...arguments_: Arguments) => Promise<Return>
  >,
) {
  const methodName = context.name as string;
  const baseTitle = toTitleCase(methodName);

  return async function (this: This, ...arguments_: Arguments): Promise<Return> {
    let stepTitle = baseTitle;

    if (arguments_.length > 0) {
      const parameterValues = arguments_
        .map((argument) => formatParameterValue(argument))
        .join(', ');
      stepTitle = `${baseTitle} ${parameterValues}`;
    }

    // Track step for bug reporting to capture steps-to-reproduce on test failure
    try {
      const testInfo = base.info();
      if (testInfo) {
        addTestStep(stepTitle, testInfo.testId);
      }
    } catch {
      // Ignore if testInfo is not available (e.g., outside test context)
    }

    return base.step(stepTitle, async () => {
      return target.call(this, ...arguments_);
    });
  };
}
