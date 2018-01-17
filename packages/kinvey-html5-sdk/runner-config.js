const path = require('path');
const walk = require('klaw-sync');

const {
  Runner,
  tasks: {
    logServer,
    runCommand,
    remove,
    processTemplateFile
  }
} = require('kinvey-universal-runner');

const serveTests = require('./test/tasks/serveTests');
const webRunTests = require('./test/tasks/webRunTests');
const rootMonoRepoPath = path.join(__dirname, '../../');
const distPath = path.join(__dirname, 'dist');

let logServerPort;
let staticPort;

const jsFilesFilter = item => path.extname(item.path) === '.js';
const shimSpecificTests = walk(path.join(__dirname, 'test', 'tests'), {
  filter: jsFilesFilter,
  nodir: true
});
const commonTests = walk(path.join(rootMonoRepoPath, 'test', 'integration'), {
  filter: jsFilesFilter,
  nodir: true
});

function runPipeline() {
  const runner = new Runner({
    pipeline: [
      logServer(),
      remove(distPath),
      runCommand({
        command: 'npm',
        args: ['run', 'build'],
        cwd: rootMonoRepoPath
      }),
      processTemplateFile(
        path.join(__dirname, 'test', 'index.template.hbs'),
        () => ({
          tests: shimSpecificTests.concat(commonTests).map(f =>
            `./${path.relative(
              path.join(__dirname, 'test'),
              f.path
            )}`),
          logServerPort
        }),
        path.join(rootMonoRepoPath, 'packages', 'kinvey-html5-sdk', 'test', 'index.html')
      ),
      serveTests(rootMonoRepoPath),
      webRunTests(() => staticPort)
    ]
  });

  runner.on('log.start', port => (logServerPort = port));
  runner.on('serve.static', port => (staticPort = port));

  runner.run().then(() => console.log('done')).catch(err => console.log(err));
}

module.exports = runPipeline;
