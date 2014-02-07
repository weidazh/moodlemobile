var templates = [
    "root/externallib/text!root/plugins/assignments/assignments.html",
    "root/externallib/text!root/plugins/assignments/assignment.html"
];

define(templates, function (assignmentsTpl, assignmentTpl) {
    var plugin = {
        settings: {
            name: "assignments",
            type: "course",
            menuURL: "#assignments/",
            lang: {
                component: "core"
            }
        },

        routes: [
            ["assignments/:courseId", "show_assignments", "showAssignments"],
            ["assignments/show/:id", "show_assignment", "showAssignment"]
        ],

        // This is like a static variable where we store the last Assignments retrieved in JSON format.
        lastAssignments: null,

        /**
         * Determines is the plugin is visible.
         * It may check Moodle remote site version, device OS, device type, etc...
         * This function is called when a alink to a plugin functinality is going to be rendered.
         *
         * @return {bool} True if the plugin is visible for the site and device
         */
        isPluginVisible: function() {

            return MM.util.wsAvailable('mod_assign_get_assignments') &&
                    MM.util.wsAvailable('mod_assign_get_grades') &&
                    MM.util.wsAvailable('mod_assign_get_submissions');
        },


        _getAssignmentsSucces: function(response, courseId) {

            MM.plugins.assignments.lastAssignments = response["courses"][0]["assignments"];

            var course = MM.db.get("courses", MM.config.current_site.id + "-" + courseId);
            var pageTitle = course.get("shortname") + " - " + MM.lang.s("assignments");

            // Removing loading icon.
            $('a[href="#assignments/' + courseId + '"]', '#panel-left').removeClass('loading-row');

            var tpl = {assignments: MM.plugins.assignments.lastAssignments};

            var html = MM.tpl.render(MM.plugins.assignments.templates.assignments.html, tpl);

            MM.panels.show('center', html, {title: pageTitle});
            // Load the first user
            if (MM.deviceType == "tablet" && MM.plugins.assignments.lastAssignments.length > 0) {
                $("#panel-center li:eq(0)").addClass("selected-row");
                MM.plugins.assignments.showAssignment(0);
                $("#panel-center li:eq(0)").addClass("selected-row");
            }

        },

        _getAssignmentsFailure: function(m, courseId) {
            // Removing loading icon.
            $('a[href="#assignments/"]', '#panel-left').addClass('loading-row');
        },

        _loadSubmissions: function(assignmentId) {
            var params = {
                "assignmentids[0]": assignmentId,
                "status": "",
                "since": "0",
                "before": "0"
            };
            MM.moodleWSCall('mod_assign_get_submissions',
                params,
                function(r) {
                    console.log(r);
                },
                null,
                function(r) {
                    $("#assignments-submissions").html("");
                });
        },

        /**
         * Display course assignments for the current course
         *
         */
        showAssignments: function(courseId) {
            MM.panels.showLoading('center');

            if (MM.deviceType == "tablet") {
                MM.panels.showLoading('right');
            }
            // Adding loading icon.
            $('a[href="#assignments/' + courseId + '"]', '#panel-left').addClass('loading-row');

            var params = {
                "courseids[0]": courseId
            };

            MM.moodleWSCall('mod_assign_get_assignments',
                params,
                function(r) {
                    MM.plugins.assignments._getAssignmentsSucces(r, courseId);
                },
                null,
                function(r) {
                    MM.plugins.assignments._getAssignmentsFailure(r, courseId);
                });
        },

        /**
         * Displays a single assignment information
         *
         * @param  {integer} assignmentId The index position in the original assignments array retrieved.
         */
        showAssignment: function(assignmentId) {

            if (typeof(MM.plugins.assignments.lastAssignments[assignmentId]) != "undefined") {
                var fullAssignment = MM.plugins.assignments.lastAssignments[assignmentId];
                var pageTitle = MM.util.formatText(fullAssignment.name);
                var tpl = {"assignment": fullAssignment};
                var html = MM.tpl.render(MM.plugins.assignments.templates.assignment.html, tpl);
                MM.panels.show('right', html, {title: pageTitle});
                // Async load of the submissions.
                MM.plugins.assignments._loadSubmissions(fullAssignment.id);
            }
        },


        templates: {
            "assignment": {
                html: assignmentTpl
            },
            "assignments": {
                html: assignmentsTpl
            }
        }

    };

    MM.registerPlugin(plugin);

});