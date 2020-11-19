const env = process.env.NODE_ENV || 'production'

//insert your API Key & Secret for each environment, keep this file local and never push it to a public repo for security purposes.
const config = {
	development :{
		APIKey : 'ZOOM_API_KEY',
		APISecret : 'ZOOM_API_SECRET',
		email: 'EMAIL_ID'
	},
	production:{	
		APIKey : 'ZOOM_API_KEY',
		APISecret : 'ZOOM_API_SECRET',
		email: 'EMAIL_ID'
	}
};

module.exports = config[env]
