// Use Aldeed's meteor-template-extension package to replace the
// default WorklistStudy template.
// See https://github.com/aldeed/meteor-template-extension
var defaultTemplate = 'studyContextMenu';
Template.lesionTrackerWorklistContextMenu.replaces(defaultTemplate);

Worklist.functions['removeTimepointAssociations'] = removeTimepointAssociations;

/**
 * Removes all present study / timepoint associations from the Clinical Trial
 */
function removeTimepointAssociations() {
    // Get a Cursor pointing to the selected Studies from the Worklist
    var selectedStudies = WorklistSelectedStudies.find({}, {
        sort: {
            studyDate: 1
        }
    });

    // Loop through the Cursor of Selected Studies
    selectedStudies.forEach(function(selectedStudy) {
        // Find the selected study in question in the Collection of
        // Timepoint/Study associated Studies
        var study = Studies.findOne({
            studyInstanceUid: selectedStudy.studyInstanceUid
        });

        // If the studies that were selected are not already associated
        // with a Timepoint, stop here
        if (!study) {
            return;
        }

        // Remove this entry from the Studies Collection
        Meteor.call('removeAssociatedStudy', study._id, function(error) {
            if (error) {
                log.warn(error);
            }
        });

        // Find the Timepoint that was previously referenced
        var timepoint = Timepoints.findOne({
            timepointId: study.timepointId
        });

        // Find the index of the current studyInstanceUid in the array
        // of reference studyInstanceUids
        var index = timepoint.studyInstanceUids.indexOf(study.studyInstanceUid);
        if (index < 0) {
            return;
        }

        // Remove the specified studyInstanceUid from the array of associated studyInstanceUids
        timepoint.studyInstanceUids.splice(index, 1);

        // Check if there are still one or more Studies associated with this Timepoint
        if (timepoint.studyInstanceUids.length) {
            // Update the Timepoints Collection with this modified array for the
            // studyInstanceUids attribute
            Timepoints.update(timepoint._id, {
                $set: {
                    studyInstanceUids: timepoint.studyInstanceUids
                }
            });
        } else {
            // If no more Studies are associated with this Timepoint, we should remove it
            // from the Timepoints Collection via a server call
            Meteor.call('removeTimepoint', timepoint._id, function(error) {
                if (error) {
                    log.warn(error);
                }
            });
        }
    });
}