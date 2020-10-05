// ui holds the user interface state
var ui = (function () {
    var m = {};

    let paused = false;

    m.isPaused = function () { return paused; }
    m.togglePause = function () { paused = !paused; }
    m.plots = null;

    function GCLines(data) {
        const gcs = stats.lastGCs;
        const mints = data.times[0];
        const maxts = data.times[data.times.length - 1];

        let shapes = [];

        for (let i = 0, n = gcs.length; i < n; i++) {
            let d = gcs[i];
            // Clamp GC times which are out of bounds
            if (d < mints || d > maxts) {
                continue;
            }

            shapes.push({
                type: 'line',
                x0: d,
                x1: d,
                yref: 'paper',
                y0: 0,
                y1: 1,
                line: {
                    color: 'rgb(55, 128, 191)',
                    width: 1,
                    dash: 'longdashdot',
                }
            })
        }
        return shapes;
    }

    function heapData(data) {
        return [
            {
                x: data.times,
                y: data.heap[0],
                type: 'scatter',
                name: 'heap alloc',
                hovertemplate: '<b>heap alloc</b>: %{y:.4s}B',
            },
            {
                x: data.times,
                y: data.heap[1],
                type: 'scatter',
                name: 'heap sys',
                hovertemplate: '<b>heap sys</b>: %{y:.4s}B',
            },
            {
                x: data.times,
                y: data.heap[2],
                type: 'scatter',
                name: 'heap idle',
                hovertemplate: '<b>heap idle</b>: %{y:.4s}B',
            },
            {
                x: data.times,
                y: data.heap[3],
                type: 'scatter',
                name: 'heap in-use',
                hovertemplate: '<b>heap in-use</b>: %{y:.4s}B',
            },
            {
                x: data.times,
                y: data.heap[4],
                type: 'scatter',
                name: 'next gc',
                hovertemplate: '<b>next gc</b>: %{y:.4s}B',
            },
        ]
    }

    // https://plotly.com/javascript/reference/layout
    let heapLayout = {
        title: 'Heap',
        xaxis: {
            title: 'time',
            tickformat: '%H:%M:%S',
        },
        yaxis: {
            title: 'bytes',
            ticksuffix: 'B',
            // tickformat: ' ',
            exponentformat: 'SI',
        }
    };

    function mspanMCacheData(data) {
        return [
            {
                x: data.times,
                y: data.mspanMCache[0],
                type: 'scatter',
                name: 'mspan inuse',
                hovertemplate: '<b>mspan in-use</b>: %{y:.4s}B',
            },
            {
                x: data.times,
                y: data.mspanMCache[1],
                type: 'scatter',
                name: 'mspan sys',
                hovertemplate: '<b>mspan sys</b>: %{y:.4s}B',
            },
            {
                x: data.times,
                y: data.mspanMCache[2],
                type: 'scatter',
                name: 'mcache inuse',
                hovertemplate: '<b>mcache in-use</b>: %{y:.4s}B',
            },
            {
                x: data.times,
                y: data.mspanMCache[3],
                type: 'scatter',
                name: 'mcache sys',
                hovertemplate: '<b>mcache sys</b>: %{y:.4s}B',
            },
        ]
    }

    let mspanMCacheLayout = {
        title: 'MSpan/MCache',
        xaxis: {
            title: 'time',
            tickformat: '%H:%M:%S',
        },
        yaxis: {
            title: 'bytes',
            ticksuffix: 'B',
            // tickformat: ' ',
            exponentformat: 'SI',
        }
    };

    const colorscale = [
        [0, 'rgb(166,206,227, 0.5)'],
        [0.05, 'rgb(31,120,180,0.5)'],
        [0.2, 'rgb(178,223,138,0.5)'],
        [0.5, 'rgb(51,160,44,0.5)'],
        [1, 'rgb(227,26,28,0.5)']
    ];

    function sizeClassData(data) {
        var ret = [
            {
                x: data.times,
                y: stats.classSizes,
                z: data.bySizes,
                type: 'heatmap',
                hovertemplate: '<br><b>size class</b>: %{y:} B' +
                    '<br><b>objects</b>: %{z}<br>',
                showlegend: false,
                colorscale: colorscale,
            }
        ];
        return ret;
    }

    let sizeClassLayout = {
        title: 'Size Classes',
        xaxis: {
            title: 'time',
            tickformat: '%H:%M:%S',
        },
        yaxis: {
            title: 'size class',
            exponentformat: 'SI',
        }
    };

    function objectsData(data) {
        return [
            {
                x: data.times,
                y: data.objects[0],
                type: 'scatter',
                name: 'live',
                hovertemplate: '<b>live objects</b>: %{y}',
            },
            {
                x: data.times,
                y: data.objects[1],
                type: 'scatter',
                name: 'lookups',
                hovertemplate: '<b>pointer lookups</b>: %{y}',
            },
            {
                x: data.times,
                y: data.objects[2],
                type: 'scatter',
                name: 'heap',
                hovertemplate: '<b>heap objects</b>: %{y}',
            },
        ]
    }

    let objectsLayout = {
        title: 'Objects',
        xaxis: {
            title: 'time',
            tickformat: '%H:%M:%S',
        },
        yaxis: {
            title: 'objects'
        }
    };

    function gcFractionData(data) {
        return [
            {
                x: data.times,
                y: data.gcfraction,
                type: 'scatter',
                name: 'gc/cpu',
                hovertemplate: '<b>gcc/CPU fraction</b>: %{y:,.4%}',
            },
        ]
    }

    let gcFractionLayout = {
        title: 'GC CPU fraction',
        xaxis: {
            title: 'time',
            tickformat: '%H:%M:%S',
        },
        yaxis: {
            title: 'gc/cpu (%)',
            tickformat: ',.5%',
        }
    };

    m.createPlots = function (data) {
        Plotly.plot('heap', heapData(data), heapLayout);
        Plotly.plot('mspan-mcache', mspanMCacheData(data), mspanMCacheLayout);
        Plotly.plot('size-class', sizeClassData(data), sizeClassLayout);
        Plotly.plot('objects', objectsData(data), objectsLayout);
        Plotly.plot('gcfraction', gcFractionData(data), gcFractionLayout);
    }

    var updateIdx = 0;
    m.updatePlots = function (data) {
        let gcLines = GCLines(data);

        heapLayout.shapes = gcLines;
        Plotly.react('heap', heapData(data), heapLayout)

        mspanMCacheLayout.shapes = gcLines;
        Plotly.react('mspan-mcache', mspanMCacheData(data), mspanMCacheLayout);

        objectsLayout.shapes = gcLines;
        Plotly.react('objects', objectsData(data), objectsLayout);

        Plotly.react('gcfraction', gcFractionData(data), gcFractionLayout);

        if (updateIdx % 5 == 0) {
            // Update the size class heatmap 5 times less often since it's expensive. 
            Plotly.react('size-class', sizeClassData(data), sizeClassLayout)
        }

        updateIdx++;
    }

    m.humanBytes = function (bytes, si = false, dp = 1) {
        const thresh = si ? 1000 : 1024;

        if (Math.abs(bytes) < thresh) {
            return bytes + ' B';
        }

        const units = si
            ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
            : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
        let u = -1;
        const r = 10 ** dp;

        do {
            bytes /= thresh;
            ++u;
        } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);

        return bytes.toFixed(dp) + ' ' + units[u];
    }


    return m;
}());