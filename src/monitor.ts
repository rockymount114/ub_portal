import { AppConfig } from './config';

export type SiteState = 'UP' | 'DOWN' | 'UNKNOWN';

export interface CheckResult {
  isHealthy: boolean;
  statusCode?: number;
  reason?: string;
  responseTimeMs: number;
}

export type StateTransition = 'TRANSITION_TO_DOWN' | 'TRANSITION_TO_UP' | 'NONE';

// Known error phrases that indicate an issue even if HTTP code is ambiguous
const ERROR_PHRASES = [
  'The requested page could not be found',
  '404 Not Found',
  'Page Not Found',
  'Service Unavailable',
  'Internal Server Error'
];

export async function checkUrl(config: AppConfig): Promise<CheckResult> {
  const startTime = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.requestTimeoutMs);

  try {
    const response = await fetch(config.targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const responseTimeMs = Date.now() - startTime;
    const statusCode = response.status;

    // First check: HTTP status code
    if (statusCode !== 200) {
      return {
        isHealthy: false,
        statusCode,
        reason: `HTTP status ${statusCode} (${response.statusText || 'Error'})`,
        responseTimeMs,
      };
    }

    // Second check: inspect response body for error keywords
    const text = await response.text();
    for (const phrase of ERROR_PHRASES) {
      if (text.includes(phrase)) {
        return {
          isHealthy: false,
          statusCode,
          reason: `Response body contains error message: "${phrase}"`,
          responseTimeMs,
        };
      }
    }

    return {
      isHealthy: true,
      statusCode,
      responseTimeMs,
    };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const responseTimeMs = Date.now() - startTime;
    let message = 'Unknown error';

    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        message = `Request timed out after ${config.requestTimeoutMs / 1000}s`;
      } else {
        message = err.message;
      }
    }

    return {
      isHealthy: false,
      reason: message,
      responseTimeMs,
    };
  }
}

export class StatusTracker {
  private currentState: SiteState = 'UNKNOWN';
  private consecutiveFailures = 0;
  private consecutiveSuccesses = 0;
  private readonly threshold: number;

  constructor(threshold: number) {
    this.threshold = threshold;
  }

  public getCurrentState(): SiteState {
    return this.currentState;
  }

  public getConsecutiveFailures(): number {
    return this.consecutiveFailures;
  }

  public getConsecutiveSuccesses(): number {
    return this.consecutiveSuccesses;
  }

  /**
   * Evaluates the latest check result and updates internal counters.
   * Returns a transition if the consecutive count reaches the configured threshold.
   */
  public evaluate(result: CheckResult): StateTransition {
    if (result.isHealthy) {
      this.consecutiveSuccesses++;
      this.consecutiveFailures = 0;

      if (this.consecutiveSuccesses >= this.threshold && this.currentState !== 'UP') {
        this.currentState = 'UP';
        return 'TRANSITION_TO_UP';
      }
    } else {
      this.consecutiveFailures++;
      this.consecutiveSuccesses = 0;

      if (this.consecutiveFailures >= this.threshold && this.currentState !== 'DOWN') {
        this.currentState = 'DOWN';
        return 'TRANSITION_TO_DOWN';
      }
    }

    return 'NONE';
  }

  /**
   * Sets initial state directly (e.g. at startup after initial check).
   */
  public setInitialState(state: SiteState): void {
    this.currentState = state;
    if (state === 'UP') {
      this.consecutiveSuccesses = this.threshold;
      this.consecutiveFailures = 0;
    } else if (state === 'DOWN') {
      this.consecutiveFailures = this.threshold;
      this.consecutiveSuccesses = 0;
    }
  }
}
