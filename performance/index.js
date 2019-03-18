const getSuite = require('./get');
const setSuite = require('./set');

function run(suites) {
    if (suites.length === 0) {
        return;
    }

    const suite = suites.shift();

    suite
        .on('start', function() {
            console.log(`== ${this.name} ==`);
        })
        .on('cycle', function(event) {
            console.log(this.name, '-', String(event.target));
        })
        .on('complete', function() {
            if (suites.length > 0) {
                console.log('');
                run(suites);
            }
        })
        .on('error', function(error) {
            console.error(error);
            process.exit(1);
        })
        .run({
            async: true,
        });
}

run([getSuite, setSuite]);
