var exec = require('child_process').exec;

function isXXXLine(line, type) {
    return line.match(new RegExp('\\[' + type + '\\]\\s+')) !== null;     
}

module.exports = {
    isDebugLine: function (line) {
        return isXXXLine(line, 'DEBUG');
    },

    isWarningLine: function (line) {
        return isXXXLine(line, 'WARN|WARNING');
    },

    isErrorLine: function (line) {
        return isXXXLine(line, 'ERROR');
    },

    isInfoLine: function (line) {
        return isXXXLine(line, 'INFO');
    },

    isTestLine: function (line, built) {
        var isJasmineLine = line.match(/\[TEST|PASS|FAIL\]\s\[.+\]\s(.+)/) !== null;
        var isCalabashLine = line.match(/building the -cal scheme/) === null;
        return isJasmineLine || (built && isCalabashLine);
    },

    isFailureLine: function (line) {
        var isJasmineFailure = isXXXLine(line, 'FAIL');
        var isCalabashFailure = line.match(/\([0-9]+\s+scenario.+failed,?/);
        return isJasmineFailure || isCalabashFailure;
    },

    isDeviceConnected: function (line) {
        return isXXXLine(line, 'INFO') && line.match(/\[.+\]\s\w+\slaunched\./) !== null;
    },

    isBuiltSuccess: function (line) {
        return isXXXLine(line, 'INFO') && line.match(/Project built successfully in/) !== null;
    },

    isCalabashBuiltSuccess: function (line) {
       return line.match(/^\*\* BUILD SUCCEEDED \*\*\s*$/) !== null;
    },

    formatJasmineLine: function (line) {
        return line
            .replace(/\[\S+,\s\S+,\s\S+\]\s/g, '')
            .replace(/\n/g, '')
            .replace(/\[TEST\]\s\[/, '[') + "\n";
    },

    formatCalabashLine: function (line) {
        var src = line;

        /* Feature */
        var featureReg = /^(Feature:[^\r\n]+)/g;
        if (line.match(featureReg)) {
            line = line.replace(featureReg, "\033[1;36m$&\033[0m");  
        }

        /* Scenario */
        var scenarioReg = /(Scenario:[^\r\n#]+)/;
        if (line.match(scenarioReg)) {
            line = line.replace(scenarioReg, "\033[0;36m$&\033[0m")
        }
        
        /* Comments */
        var commentReg = /(#[^\r\n]+)/g, comment;
        while ((comment = commentReg.exec(src)) !== null) {
            line = line.replace(comment[1], "\033[0;30m$&\033[0m");
        }

        /* Errors */
        var errorReg = /((\r|\n)[^\r\n]+\(RuntimeError\))/;
        if (line.match(errorReg)) {
            line = line.replace(errorReg, "\033[0;31m$&\033[0m");
        }

        /* Failure */
        var failureReg = /(^Failing Scenarios:)/;
        if (line.match(failureReg)) {
            line = line.replace(failureReg, "\033[1;31m$&\033[0m");
        }

        /* Step Definition*/
        var stepReg = /You can implement/;
        if (line.match(stepReg)) {
            line = "\033[0;33m" + line + "\033[0m";
        }

        return line;
    },

    clean_env: function () {
        exec('ps', function (err, stdout) {
            if (err) { 
                process.stdout.write('\033[1;30mFailed to clean environment\033[0m\n');
            } else {
                var re = /([0-9]+).+node.+(tishadow\sserver|ti)\s.+/g, 
                    pid;

                while ((pid = re.exec(stdout)) !== null) {
                    exec('kill -9 ' + pid[1]);
                }

                exec('ti clean && tishadow clear');
            }   
        });
    },

    abort: function (msg, callback) {
        var err = new Error('\033[1;30m' + msg + '\033[0m');
        err.showStack = false;
        module.exports.clean_env();
        if (callback) return callback(err);

        /* No callback supplied */
        process.stdout.write('\033[0;31m' + msg + '\033[0m\n');
        process.exit(1);
    }

};
