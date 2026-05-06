import Bugsnag from '@bugsnag/js';

const apiKey = process.env.NEXT_PUBLIC_BUGSNAG_API_KEY;
const releaseStage = process.env.NEXT_PUBLIC_RELEASE_STAGE || 'development';

console.log('[Bugsnag init] client', {
  hasApiKey: !!apiKey,
  apiKeyPrefix: apiKey ? apiKey.slice(0, 8) + '…' : null,
  releaseStage,
  alreadyStarted:
    typeof Bugsnag.isStarted === 'function' ? Bugsnag.isStarted() : 'no isStarted method',
});

if (apiKey && (typeof Bugsnag.isStarted !== 'function' || !Bugsnag.isStarted())) {
  try {
    Bugsnag.start({
      apiKey,
      releaseStage,
      enabledReleaseStages: ['production', 'preview', 'development'],
    });
    console.log('[Bugsnag init] client started successfully');
  } catch (err) {
    console.error('[Bugsnag init] client start failed', err);
  }
}
