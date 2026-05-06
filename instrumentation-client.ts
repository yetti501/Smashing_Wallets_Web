import Bugsnag from '@bugsnag/js';

const apiKey = process.env.NEXT_PUBLIC_BUGSNAG_API_KEY;
const releaseStage = process.env.NEXT_PUBLIC_RELEASE_STAGE || 'development';

if (apiKey && !Bugsnag.isStarted()) {
  Bugsnag.start({
    apiKey,
    releaseStage,
    enabledReleaseStages: ['production', 'preview', 'development'],
  });
}
