setup:
	# @Creates source folders and destination folders for compiled resources
	mkdir -p dist/assets/{js,img,css,fonts} && mkdir -p src/{js,img,pug,sass,fonts,iconfonts} && touch src/js/app.js && touch src/sass/app.scss && mkdir -p src/sass/{abstract,base,components,layout,pages,vendors,themes} && touch src/pug/index.pug && yarn install
start:
	# @Runs gulp and webpack in parallel
	gulp &! webpack -w
generate-foundation-settings:
	#@copy foundation default settings
	curl https://raw.githubusercontent.com/zurb/foundation-sites/develop/scss/settings/_settings.scss > src/sass/_settings.scss