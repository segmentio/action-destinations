.PHONY: serve serve-browser help

# Build cloud destinations once then start the local destbuilder UI.
# Usage: make serve               (prompts for destination)
#        make serve DEST=memora   (starts directly for a specific destination)
serve:
	yarn cloud build
	./bin/run serve $(if $(DEST),--destination=$(DEST),)

# Build browser destinations once then start the local browser destbuilder UI.
# Usage: make serve-browser               (prompts for destination)
#        make serve-browser DEST=braze    (starts directly for a specific destination)
serve-browser:
	yarn browser build-web
	./bin/run serve --browser $(if $(DEST),--destination=$(DEST),)

help:
	@echo "Available targets:"
	@echo "  make serve [DEST=<slug>]         - Build cloud destinations once, then start destbuilder"
	@echo "  make serve-browser [DEST=<slug>] - Build browser destinations once, then start destbuilder"
