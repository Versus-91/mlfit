
module.exports = {
    plugins: ["@babel/plugin-transform-private-methods", '@babel/plugin-syntax-dynamic-import'],
    presets: [
        ['@vue/app', {
            polyfills: [
                'es.promise',
                'es.symbol',
            ]
        }]
    ]
}