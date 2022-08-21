const fetch = require('cross-fetch');

module.exports = async () => {
    try {
        const { OAUTH_TOKEN, ORG_ID, RELEASE_TAG, TASK_ID } = process.env;

        // Comment content
        console.log('Comment content:');
        
        const data = `Собран образ с тегом ${RELEASE_TAG}`;
        console.log(data);

        // Add comment to the task
        console.log('Add comment about docker build to the task');

        await fetch(`https://api.tracker.yandex.net/v2/issues/${TASK_ID}/comments`, {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
                'Authorization': `OAuth ${OAUTH_TOKEN}`,
                'X-Org-ID': ORG_ID,
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.log(error);
    }
}