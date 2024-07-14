
module.exports = {
    plugins: ["@babel/plugin-transform-private-methods"],
    presets: [
        ['@vue/app', {
            polyfills: [
                'es.promise',
                'es.symbol',
            ]
        }]
    ]
}