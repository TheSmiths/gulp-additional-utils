var exec = require('child_process').exec;

module.exports = {
    clean_env: function (callback) {
        exec('ps -e -o pid,command | grep node', function (err, stdout) {
            if (err) { 
                process.stdout.write('\033[1;30mFailed to clean environment\033[0m\n');
            } else {
                var re = /([0-9]+)[^\n]+(--appify|tishadow)[^\n]+\n/g,
                    pid;

                while ((pid = re.exec(stdout)) !== null) {
                    exec('kill -9 ' + pid[1]);
                }
		
                exec('ti clean && tishadow clear', callback);
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
