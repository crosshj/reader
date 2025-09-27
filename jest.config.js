export default {
	testEnvironment: 'jsdom',
	moduleNameMapper: {
		'^@/(.*)$': '<rootDir>/src/$1',
		'\\.(css|less|scss|sass)$': 'identity-obj-proxy',
	},
	transform: {
		'^.+\\.js$': 'babel-jest',
	},
	moduleFileExtensions: ['js', 'json'],
	testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
	collectCoverageFrom: ['src/**/*.js', '!**/*.test.js', '!**/__tests__/**'],
};
