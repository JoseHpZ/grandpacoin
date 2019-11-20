exports.setCorsHeadersMiddleware = (request, response, next) => {
    response.set({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST',
        'Access-Control-Allow-Headers': 'Accept,Content-Type'
    });
    next();
}