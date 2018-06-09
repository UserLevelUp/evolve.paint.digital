package main

import (
	"log"
	"net/http"
	"time"

	"github.com/gin-contrib/gzip"
	"github.com/gin-gonic/gin"
)

// keep limited history of top organism, in order to send out patches
// apply incoming patch to current top organism
// send out top organism as patch, using history as reference (along with expected hash)

// ServerPortal provides http handlers (designed for the gin framework) to
// check out work items and submit results
type ServerPortal struct {
	incubator      *Incubator
	organismCache  *OrganismCache
	patchProcessor *PatchProcessor

	// communication channels
	patchRequestChan chan *GetPatchRequest
	updateChan       chan *UpdateRequest
}

// NewServerPortal returns a new ServerPortal
func NewServerPortal(incubator *Incubator) *ServerPortal {
	handler := new(ServerPortal)
	handler.incubator = incubator
	handler.patchProcessor = &PatchProcessor{}
	handler.organismCache = NewOrganismCache()
	handler.patchRequestChan = make(chan *GetPatchRequest)
	handler.updateChan = make(chan *UpdateRequest)
	return handler
}

// Start begins listening on http port 8000 for external requests.
func (handler *ServerPortal) Start() {
	handler.startRequestHandler()
	handler.startBackgroundRoutine()
}

func (handler *ServerPortal) startBackgroundRoutine() {
	go func() {
		for {
			select {
			case req := <-handler.patchRequestChan:
				req.Callback <- handler.organismCache.GetPatch(req.Baseline, req.Target)
			case req := <-handler.updateChan:
				topOrganism := handler.incubator.GetTopOrganism()
				handler.organismCache.Put(topOrganism.Hash(), topOrganism)
				req.Callback <- true
			}
		}
	}()
}

func (handler *ServerPortal) startRequestHandler() {
	// Http handler
	go func() {
		r := gin.New()
		r.Use(gzip.Gzip(gzip.BestCompression))
		r.GET("/", func(ctx *gin.Context) {
			ctx.Data(http.StatusOK, "text/plain", []byte("Service is up!"))
		})
		// r.GET("/work-item", handler.GetWorkItem)
		// r.POST("/result", handler.SubmitResult)
		r.GET("/organism/delta", handler.GetTopOrganismDelta)
		r.GET("/organism", handler.GetTopOrganism)
		r.POST("/organism", handler.SubmitOrganism)
		r.GET("/target", handler.GetTargetImageData)
		http.ListenAndServe("0.0.0.0:8000", r)
	}()
	time.Sleep(time.Millisecond * 100)
}

// Update makes sure that the current top organism is cached.
func (handler *ServerPortal) Update() {
	callback := make(chan bool)
	handler.updateChan <- &UpdateRequest{
		Callback: callback,
	}
	<-callback
}

func (handler *ServerPortal) GetTargetImageData(ctx *gin.Context) {
	imageData := handler.incubator.GetTargetImageData()
	ctx.Data(http.StatusOK, "image/png", imageData)
}

func (handler *ServerPortal) GetTopOrganism(ctx *gin.Context) {
	hashOnly := ctx.Query("hashonly") == "true"
	topOrganism := handler.incubator.GetTopOrganism()
	if hashOnly {
		ctx.Data(http.StatusOK, "text/plain", []byte(topOrganism.Hash()))
	} else {
		// TODO: change to SaveV2 at some point
		ctx.Data(http.StatusOK, "application/binary", topOrganism.Save())
		log.Printf("GetTopOrganism: exported top organism '%v'", topOrganism.Hash())
	}
}

func (handler *ServerPortal) GetTopOrganismDelta(ctx *gin.Context) {
	patch := &Patch{
		Operations: []*PatchOperation{},
	}
	previous := ctx.Query("previous")
	topOrganism := handler.incubator.GetTopOrganism()
	if topOrganism == nil {
		log.Println("GetTopOrganismDelta - No top organism loaded...")
		ctx.JSON(http.StatusNotFound, nil)
		return
	}
	// No updates
	if topOrganism.Hash() == previous {
		log.Printf("GetTopOrganismDelta %v - no changes", previous)
		ctx.JSON(http.StatusOK, patch)
		return
	}
	// Ensure topOrganism is in the cache
	handler.organismCache.Put(topOrganism.Hash(), topOrganism)
	callback := make(chan *Patch)
	handler.patchRequestChan <- &GetPatchRequest{
		Baseline: previous,
		Target:   topOrganism.Hash(),
		Callback: callback,
	}
	patch = <-callback
	if patch == nil {
		log.Printf("GetTopOrganismDelta: %v not found", previous)
		ctx.JSON(http.StatusNotFound, map[string]interface{}{"Message": "Previous organism not found"})
		return
	}

	log.Printf("GetTopOrganismDelta: Sending %v -> %v, %v operations", previous, topOrganism.Hash(), len(patch.Operations))
	ctx.JSON(http.StatusOK, &GetOrganismDeltaResponse{
		Hash:  topOrganism.Hash(),
		Patch: patch,
	})
}

func (handler *ServerPortal) SubmitOrganism(ctx *gin.Context) {
	patch := &Patch{}
	err := ctx.BindJSON(patch)
	if err != nil {
		ctx.AbortWithError(http.StatusBadRequest, err)
	}
	// Apply the patch to the top organism and submit to incubator
	topOrganism := handler.incubator.GetTopOrganism()
	log.Printf("Applying patch to top organism %v - %v operations", topOrganism.Hash(), len(patch.Operations))
	updated := handler.patchProcessor.ProcessPatch(topOrganism, patch)
	log.Printf("New organism after patch: %v", updated.Hash())
	handler.incubator.SubmitOrganisms([]*Organism{updated}, false)
}

// GetPatchRequest is a request to get a combined Patch that will transform
// the baseline organism into the target organism
type GetPatchRequest struct {
	Baseline string
	Target   string
	Callback chan<- *Patch
}

// GetOrganismDeltaResponse contains a patch that can be applied, and a hash to
// verify the output organism is the same one as expected.
type GetOrganismDeltaResponse struct {
	Hash  string `json:"hash"`
	Patch *Patch `json:"patch"`
}

// An UpdateRequest is a request to update the portal after an iteration,
// to make sure that the top organism is always recorded in the cache.
type UpdateRequest struct {
	Callback chan<- bool
}
