import apiRoute from './api_routes.js'

const constructorMethod = (app) => {
    app.use('/', apiRoute);
  
    app.use('*', (req, res) => {
      return res.status(404).json({error: 'Not found'});
    });
  };
  
export default constructorMethod;