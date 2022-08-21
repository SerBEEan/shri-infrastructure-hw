const fetch = require('cross-fetch');

module.exports = async ({ github, context, core, exec }) => {
    try {
        const { OAUTH_TOKEN, ORG_ID } = process.env;
        const { payload } = context;

        // Listen and save the output of the git commands
        let myOutput = '';
        let myError = '';

        const options = {
            listeners: {
                stdout: (data) => {
                    myOutput += data.toString();
                },
                stderr: (data) => {
                    myError += data.toString();
                }
            }
        };

        // Getting information about tags
        console.log('Getting information about tags');

        await exec.exec('git tag', ['-l', '--sort=-version:refname'], options);
        const tags = myOutput.split('\n');

        // Finding current and previous release tags
        let currentRelease = '';
        let previousRelease = '';

        for (const tag of tags) {
            if (/rc-[0-9]+.[0-9]+.[0-9]+/.test(tag)) {
                if (!currentRelease) {
                    currentRelease = tag;
                } else {
                    previousRelease = tag;
                    break;
                }
            }
        }

        console.log(`currentRelease: ${currentRelease}`);
        console.log(`previousRelease: ${previousRelease}`);

        if (currentRelease) {
            myOutput = '';
            myError = '';

            // Getting information about release commits
            console.log('Getting information about release commits');

            const gitLogFlags = ['--pretty=format:"%H%x20%an%x20%s"'];
            if (previousRelease && currentRelease) {
                gitLogFlags.push(`${previousRelease}..${currentRelease}`);
            }
            await exec.exec('git log', gitLogFlags, options);

            // Getting information about release date and author
            console.log('Getting information about release date and author');

            const releaseDate = Date.now();
            const USDate = new Intl.DateTimeFormat('en-US');
            let summary = `Релиз №${currentRelease.slice(3)} от ${USDate.format(releaseDate)}`;
            
            const releaseAuthor = payload.head_commit.committer.name;
            let description = `Ответственный за релиз: ${releaseAuthor}\n`;
            description += '\nКоммиты, попавшие в релиз:\n'; 
            description += myOutput.replaceAll('"', '');

            // Release content
            console.log('Release content:');
            
            const data = { summary, description };
            console.log(data);

            // Updating task in tracker
            console.log('Updating task in tracker');

            await fetch('https://api.tracker.yandex.net/v2/issues/INFRA-82', {
                method: 'PATCH',
                body: JSON.stringify(data),
                headers: {
                    'Authorization': `OAuth ${OAUTH_TOKEN}`,
                    'X-Org-ID': ORG_ID,
                    'Content-Type': 'application/json'
                }
            });
        }

    } catch (error) {
        console.log(error);
    }
}
