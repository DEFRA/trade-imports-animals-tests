import fs from 'node:fs';
import type { FullResult, Reporter, TestCase, TestResult } from '@playwright/test/reporter';

type FailedSummary = {
  finished: number;
  passed: number;
  retries: number;
  failed: number;
};

const FAILED_FILE = 'FAILED';

class FailedSuiteReporter implements Reporter {
  private finished = 0;
  private passed = 0;
  private failed = 0;
  private retries = 0;

  onTestEnd(_test: TestCase, result: TestResult): void {
    if (result.status !== 'skipped') {
      this.finished += 1;
    }

    if (result.status === 'passed') {
      this.passed += 1;
    } else if (result.status === 'failed' || result.status === 'timedOut' || result.status === 'interrupted') {
      this.failed += 1;
    }

    if (result.retry > 0) {
      this.retries += 1;
    }
  }

  onEnd(result: FullResult): void {
    const summary: FailedSummary = {
      finished: this.finished,
      passed: this.passed,
      retries: this.retries,
      failed: this.failed,
    };

    if (this.failed > 0 || result.status === 'failed') {
      fs.writeFileSync(FAILED_FILE, JSON.stringify(summary));
    } else if (fs.existsSync(FAILED_FILE)) {
      fs.rmSync(FAILED_FILE);
    }
  }
}

export default FailedSuiteReporter;
