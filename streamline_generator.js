const glMatrix = require("gl-matrix");
const math = require("mathjs");

class StreamlineGenerator {

    constructor(p_streamline_context) {
        this.p_streamline_context = p_streamline_context;
        this.p_ui_seeds = p_streamline_context.ui_seeds;
        this.seeds = [];
        this.num_points_per_streamline = 10;
        this.step_size = 0.0125;
        this.epsilon_move_just_outside_cube = 0.00001;
        this.confine_to_cube = false;
        this.check_bounds = true;
        this.continue_at_bounds = true;
        this.tubeRadius = 0.005;

        this.streamline_error_counter = 0;
        this.termination_condition = STREAMLINE_TERMINATION_CONDITION_POINTS;
        this.termination_advection_time = 0;
        this.termination_arc_length = 0;
    }

    GenerateExampleSeeds() {
        console.log("GenerateExampleSeeds");
        this.seeds = [];

        var seed = glMatrix.vec4.fromValues(0.01, 0.25, 0.25, 1);
        this.seeds.push(seed);
        seed = glMatrix.vec4.fromValues(0.99, 0.25, 0.75, 1);
        this.seeds.push(seed);
        seed = glMatrix.vec4.fromValues(0.55, 0.25, 0.5, 1);
        this.seeds.push(seed);
        seed = glMatrix.vec4.fromValues(0.95, 0.25, 0.5, 1);
        this.seeds.push(seed);
        seed = glMatrix.vec4.fromValues(0.25, 0.25, 0.1, 1);
        this.seeds.push(seed);
        seed = glMatrix.vec4.fromValues(0.25, 0.25, 0.9, 1);
        this.seeds.push(seed);
    }

    GenerateSeedsFromUI() {
        console.log("GenerateSeedsFromUI");
        //this.seeds = this.p_ui_seeds.createPointList();
        this.p_ui_seeds.createPointList(this.space);
        this.seeds = this.p_ui_seeds.point_list;
        this.seed_signums = this.p_ui_seeds.seed_signums;
        console.log("seeds");
        console.log(this.seeds);
    }    

    SetRulesTorus() {
        console.log("SetRulesTorus");
        //rules
        this.shader_rule_x_pos_x = "x-1";	//if x>1 : x=___
        this.shader_rule_x_pos_y = "y";		//if x>1 : y=___
        this.shader_rule_x_pos_z = "z";	    //if x>1 : z=___

        this.shader_rule_y_pos_x = "x";	    //if y>1 : x=___
        this.shader_rule_y_pos_y = "y-1";	//if y>1 : y=___
        this.shader_rule_y_pos_z = "z";	    //if y>1 : z=___

        this.shader_rule_z_pos_x = "x";	    //if z>1 : x=___
        this.shader_rule_z_pos_y = "y";	    //if z>1 : y=___
        this.shader_rule_z_pos_z = "z-1";	//if z>1 : z=___

        //inverted rules
        this.shader_rule_x_neg_x = "x+1";	//if x>1 : x=___
        this.shader_rule_x_neg_y = "y";		//if x>1 : y=___
        this.shader_rule_x_neg_z = "z";	    //if x>1 : z=___

        this.shader_rule_y_neg_x = "x";	    //if y>1 : x=___
        this.shader_rule_y_neg_y = "y+1";	//if y>1 : y=___
        this.shader_rule_y_neg_z = "z";	    //if y>1 : z=___

        this.shader_rule_z_neg_x = "x";	    //if z>1 : x=___
        this.shader_rule_z_neg_y = "y";	    //if z>1 : y=___
        this.shader_rule_z_neg_z = "z+1";	//if z>1 : z=___
    }

    SetRules2Plus2D(){
        
        //rules
        this.shader_rule_x_pos_x = "x-1";	        //if x>1 : x=___
        this.shader_rule_x_pos_y = "y";		        //if x>1 : y=___
        this.shader_rule_x_pos_v_x = "v_x";	        //if x>1 : v_x=___
        this.shader_rule_x_pos_v_y = "v_y";	        //if x>1 : v_y=___

        this.shader_rule_y_pos_x = "x";	            //if y>1 : x=___
        this.shader_rule_y_pos_y = "y-1";		    //if y>1 : y=___
        this.shader_rule_y_pos_v_x = "v_x";	        //if y>1 : v_x=___
        this.shader_rule_y_pos_v_y = "v_y";	        //if y>1 : v_y=___

        this.shader_rule_v_x_pos_x = "x";	        //if v_x>1 : x=___
        this.shader_rule_v_x_pos_y = "y";		    //if v_x>1 : y=___
        this.shader_rule_v_x_pos_v_x = "v_x-1";	    //if v_x>1 : v_x=___
        this.shader_rule_v_x_pos_v_y = "v_y";	    //if v_x>1 : v_y=___

        this.shader_rule_v_y_pos_x = "x";	        //if v_y>1 : x=___
        this.shader_rule_v_y_pos_y = "y";		    //if v_y>1 : y=___
        this.shader_rule_v_y_pos_v_x = "v_x";	    //if v_y>1 : v_x=___
        this.shader_rule_v_y_pos_v_y = "v_y-1";	    //if v_y>1 : v_y=___

        //inverted rules
        this.shader_rule_x_neg_x = "x+1";	        //if x<1 : x=___
        this.shader_rule_x_neg_y = "y";		        //if x<1 : y=___
        this.shader_rule_x_neg_v_x = "v_x";	        //if x<1 : v_x=___
        this.shader_rule_x_neg_v_y = "v_y";	        //if x<1 : v_y=___

        this.shader_rule_y_neg_x = "x";	            //if y<1 : x=___
        this.shader_rule_y_neg_y = "y+1";		    //if y<1 : y=___
        this.shader_rule_y_neg_v_x = "v_x";	        //if y<1 : v_x=___
        this.shader_rule_y_neg_v_y = "v_y";	        //if y<1 : v_y=___

        this.shader_rule_v_x_neg_x = "x";	        //if v_x<1 : x=___
        this.shader_rule_v_x_neg_y = "y";		    //if v_x<1 : y=___
        this.shader_rule_v_x_neg_v_x = "v_x+1";	    //if v_x<1 : v_x=___
        this.shader_rule_v_x_neg_v_y = "v_y";	    //if v_x<1 : v_y=___

        this.shader_rule_v_y_neg_x = "x";	        //if v_y<1 : x=___
        this.shader_rule_v_y_neg_y = "y";		    //if v_y<1 : y=___
        this.shader_rule_v_y_neg_v_x = "v_x";	    //if v_y<1 : v_x=___
        this.shader_rule_v_y_neg_v_y = "v_y+1";	    //if v_y<1 : v_y=___
    }

    CalculateRawStreamlines(raw_data, part_index) {
        console.log("CalculateRawStreamlines: part_index: ", part_index);
        var t_start = performance.now();

        raw_data.initialize(this.seeds, this.seed_signums, this.num_points_per_streamline);

        switch (this.space) {
            case SPACE_3_TORUS:
                for (var i = 0; i < this.seeds.length; i++) {
                    this.CalculateRawStreamline3Torus(i, raw_data);
                }
                break;
            case SPACE_2_PLUS_2D:
                var snap_nearest_z = part_index == PART_INDEX_OUTSIDE;
                for (var i = 0; i < this.seeds.length; i++) {
                    this.CalculateRawStreamline2Plus2D(i, raw_data, snap_nearest_z);
                }
                //raw_data.SwapComponents_0123_2301();
                break;
            default:
                console.log("Error unknonw space");
                break;
        }

        console.log("CalculateRawStreamlines completed");

        var t_stop = performance.now();
        console.log("Performance: calculated raw streamlines in: ", Math.ceil(t_stop-t_start), "ms");
    }

    CalculateRawStreamline3Torus(seed_index, raw_data) {
        console.log("CalculateRawStreamline3Torus: ", seed_index);

        var startIndex = seed_index * this.num_points_per_streamline;
        var total_points = raw_data.num_points;
        var positionData = raw_data.data[startIndex];
        var startPosition = glMatrix.vec3.fromValues(positionData.position[0], positionData.position[1], positionData.position[2]);
        //var signum = (positionData.u_v_w_signum[3] > 0) ? 1 : -1;
        var signum = positionData.flag;

        var f_start = this.f(startPosition, signum);
        raw_data.data[startIndex].flag = signum;
        raw_data.data[startIndex].u_v_w_signum = glMatrix.vec4.fromValues(f_start[0], f_start[1], f_start[2], 1);
        var previousPosition = startPosition;
        console.log("startIndex: ", startIndex);
        console.log("positionData: ", positionData);
        console.log("startPosition: ", startPosition);
        console.log("previousPosition: ", previousPosition);

        var currentPosition = glMatrix.vec3.create();
        var k1 = glMatrix.vec3.create();
        var k2 = glMatrix.vec3.create();
        var k3 = glMatrix.vec3.create();
        var k4 = glMatrix.vec3.create();
        var k1_2 = glMatrix.vec3.create();// k1_2 = k1/2
        var k2_2 = glMatrix.vec3.create();// k2_2 = k2/2
        var k1_6 = glMatrix.vec3.create();// k1_6 = k1/6
        var k2_3 = glMatrix.vec3.create();// k2_3 = k2/3
        var k3_3 = glMatrix.vec3.create();// k3_3 = k3/3
        var k4_6 = glMatrix.vec3.create();// k4_6 = k4/6
        var previous_plus_k1_2 = glMatrix.vec3.create();// previousPosition + k1/2
        var previous_plus_k2_2 = glMatrix.vec3.create();// previousPosition + k2/2
        var previous_plus_k3 = glMatrix.vec3.create();// previousPosition + k3

        var arc_length = 0;
        for (var i = 1; i < this.num_points_per_streamline; i++) {

            var currentIndex = startIndex + i;
            var previousIndex = currentIndex - 1;
            var previousVec4 = raw_data.data[previousIndex].position;
            previousPosition = glMatrix.vec3.fromValues(previousVec4[0], previousVec4[1], previousVec4[2]);
            //console.log("i: ", i);
            //console.log("previousPosition: ", previousPosition);
            //console.log("this.step_size: ", this.step_size);

            //CALCULATE: vec3 k1 = step_size * f(previousPosition, signum);
            glMatrix.vec3.scale(k1, this.f(previousPosition, signum), this.step_size);

            //CALCULATE: vec3 k2 = step_size * f(previousPosition + k1/2, signum);
            glMatrix.vec3.scale(k1_2, k1, 1 / 2);// k1_2 = k1/2
            glMatrix.vec3.add(previous_plus_k1_2, previousPosition, k1_2);// previousPosition + k1/2            
            glMatrix.vec3.scale(k2, this.f(previous_plus_k1_2, signum), this.step_size);

            //CALCULATE: vec3 k3 = step_size * f(previousPosition + k2/2, signum);
            glMatrix.vec3.scale(k2_2, k2, 1 / 2);// k2_2 = k2/2
            glMatrix.vec3.add(previous_plus_k2_2, previousPosition, k2_2);// previousPosition + k2/2     
            glMatrix.vec3.scale(k3, this.f(previous_plus_k2_2, signum), this.step_size);

            //CALCULATE: vec3 k4 = step_size * f(previousPosition + k3, signum);
            glMatrix.vec3.add(previous_plus_k3, previousPosition, k3);// previousPosition + k3
            glMatrix.vec3.scale(k4, this.f(previous_plus_k3, signum), this.step_size);

            //CALCULATE: vec3 currentPosition = previousPosition + k1 / 6 + k2 / 3 + k3 / 3 + k4 / 6;
            glMatrix.vec3.scale(k1_6, k1, 1 / 6);// k1_6 = k1/6
            glMatrix.vec3.scale(k2_3, k2, 1 / 3);// k2_3 = k2/3
            glMatrix.vec3.scale(k3_3, k3, 1 / 3);// k3_3 = k3/3
            glMatrix.vec3.scale(k4_6, k4, 1 / 6);// k4_6 = k4/6
            glMatrix.vec3.add(currentPosition, previousPosition, k1_6);// previousPosition + k1 / 6 
            glMatrix.vec3.add(currentPosition, currentPosition, k2_3);// previousPosition + k1 / 6 + k2 / 3
            glMatrix.vec3.add(currentPosition, currentPosition, k3_3);// previousPosition + k1 / 6 + k2 / 3 + k3 / 3
            glMatrix.vec3.add(currentPosition, currentPosition, k4_6);// previousPosition + k1 / 6 + k2 / 3 + k3 / 3 + k4 / 6

            //console.log(i, currentPosition);
            if (this.confine_to_cube)
                currentPosition = this.ConfineToCube(currentPosition, previousPosition);


            var flag = 2;//2=normal point   1=new polyline   3=end polyline   0=skip point
            var f_previous = this.f(previousPosition, signum);
            var f_current = this.f(currentPosition, signum);
            var v_previous = glMatrix.vec3.length(f_previous);
            var v_current = glMatrix.vec3.length(f_current);
            var v_average = (v_previous + v_current) * 0.5;
            var time_previous = raw_data.data[previousIndex].time;

            var difference = glMatrix.vec3.create();
            glMatrix.vec3.subtract(difference, currentPosition, previousPosition);
            var segment_length = glMatrix.vec3.length(difference);
            arc_length += segment_length;

            var time_current = time_previous + (segment_length / v_average);//var time_current = time_previous + (this.step_size / v_average);
            
            console.log("time_current", time_current);

            if (i == this.num_points_per_streamline - 1)
                flag = 3;//end of polyline

            var terminate = false;

            if(this.AdditionalTerminationChecks(time_current, arc_length)){
                terminate = true;
                flag = 3;//end of polyline
            }
            else if (this.check_bounds) {
                var outOfBounds = this.CheckOutOfBounds3(currentPosition);
                if (outOfBounds) {
                    flag = 3;//end of polyline
                    //vectorPosition[currentIndex]= vec4(currentPosition, 3);//3 = end

                    if (this.continue_at_bounds && i < this.num_points_per_streamline - 2) {
                        var movedPosition = this.MoveOutOfBounds3(currentPosition);
                        var f_movedPosition = this.f(movedPosition, signum);
                        var v_movedPosition = glMatrix.vec3.length(f_movedPosition);
                        raw_data.data[currentIndex + 1].flag = signum;//1 or -1 for start
                        raw_data.data[currentIndex + 1].position = glMatrix.vec4.fromValues(movedPosition[0], movedPosition[1], movedPosition[2], 1);;//1 or -1 for start
                        raw_data.data[currentIndex + 1].u_v_w_signum = glMatrix.vec4.fromValues(f_movedPosition[0], f_movedPosition[1], f_movedPosition[2], signum);
                        raw_data.data[currentIndex + 1].time = time_current;
                        raw_data.data[currentIndex + 1].velocity = v_movedPosition;
                        i++;
                    }
                    else {
                        terminate = true;
                    }
                }
            }

            raw_data.data[currentIndex].flag = flag;
            raw_data.data[currentIndex].position = glMatrix.vec4.fromValues(currentPosition[0], currentPosition[1], currentPosition[2], 1);
            raw_data.data[currentIndex].u_v_w_signum = glMatrix.vec4.fromValues(f_current[0], f_current[1], f_current[2], signum);
            raw_data.data[currentIndex].time = time_current;

            //previousPosition = currentPosition;
            if (terminate)
                break;

        }
    }

    AdditionalTerminationChecks(time_current, arc_length_current){
        if(this.termination_condition == STREAMLINE_TERMINATION_CONDITION_ADVECTION_TIME){
            if(time_current > this.termination_advection_time){
                return true;
            }
        }
        if(this.termination_condition == STREAMLINE_TERMINATION_CONDITION_ARC_LENGTH){
            if(arc_length_current > this.termination_arc_length){
                return true;
            }
        }
        return false;
    }

    CalculateRawStreamline2Plus2D(seed_index, raw_data, snap_nearest_z) {
        console.log("CalculateRawStreamline2Plus2D: ", seed_index, "check bounds:", this.check_bounds, "snap_nearest_z:", snap_nearest_z);

        var startIndex = seed_index * this.num_points_per_streamline;
        var total_points = raw_data.num_points;
        var positionData = raw_data.data[startIndex];
        var startPosition = glMatrix.vec4.fromValues(positionData.position[0], positionData.position[1], positionData.position[2], positionData.position[3]);
        //var signum = (positionData.u_v_w_signum[3] > 0) ? 1 : -1;
        var signum = positionData.flag;

        var f_start = this.g(startPosition, signum);
        raw_data.data[startIndex].flag = signum;
        raw_data.data[startIndex].u_v_w_signum = glMatrix.vec4.fromValues(f_start[0], f_start[1], f_start[2], 1);//TODO
        raw_data.data[startIndex].position = glMatrix.vec4.fromValues(startPosition[0], startPosition[1], startPosition[2], startPosition[3]);
        raw_data.data[startIndex].CalculateAngleFromPosition_3_2();
        var previousPosition = startPosition;
        console.log("startIndex: ", startIndex);
        console.log("positionData: ", positionData);
        console.log("startPosition: ", startPosition);
        console.log("previousPosition: ", previousPosition);

        //var currentPosition = glMatrix.vec4.create();
        var currentPosition = glMatrix.vec4.fromValues(startPosition[0], startPosition[1], startPosition[2], startPosition[3]);
        var k1 = glMatrix.vec4.create();
        var k2 = glMatrix.vec4.create();
        var k3 = glMatrix.vec4.create();
        var k4 = glMatrix.vec4.create();
        var k1_2 = glMatrix.vec4.create();// k1_2 = k1/2
        var k2_2 = glMatrix.vec4.create();// k2_2 = k2/2
        var k1_6 = glMatrix.vec4.create();// k1_6 = k1/6
        var k2_3 = glMatrix.vec4.create();// k2_3 = k2/3
        var k3_3 = glMatrix.vec4.create();// k3_3 = k3/3
        var k4_6 = glMatrix.vec4.create();// k4_6 = k4/6
        var previous_plus_k1_2 = glMatrix.vec4.create();// previousPosition + k1/2
        var previous_plus_k2_2 = glMatrix.vec4.create();// previousPosition + k2/2
        var previous_plus_k3 = glMatrix.vec4.create();// previousPosition + k3

        var arc_length = 0;
        for (var i = 1; i < this.num_points_per_streamline; i++) {

            var currentIndex = startIndex + i;
            var previousIndex = currentIndex - 1;
            var previousVec4 = raw_data.data[previousIndex].position;
            previousPosition = glMatrix.vec4.fromValues(previousVec4[0], previousVec4[1], previousVec4[2], previousVec4[3]);
            //previousPosition = glMatrix.vec4.fromValues(currentPosition[0], currentPosition[1], currentPosition[2], currentPosition[3]);
            //console.log("i: ", i);
            //console.log("previousPosition: ", previousPosition);
            //console.log("this.step_size: ", this.step_size);

            //CALCULATE: vec3 k1 = step_size * f(previousPosition, signum);
            glMatrix.vec4.scale(k1, this.g(previousPosition, signum), this.step_size);

            //CALCULATE: vec3 k2 = step_size * f(previousPosition + k1/2, signum);
            glMatrix.vec4.scale(k1_2, k1, 1 / 2);// k1_2 = k1/2
            glMatrix.vec4.add(previous_plus_k1_2, previousPosition, k1_2);// previousPosition + k1/2            
            glMatrix.vec4.scale(k2, this.g(previous_plus_k1_2, signum), this.step_size);

            //CALCULATE: vec3 k3 = step_size * f(previousPosition + k2/2, signum);
            glMatrix.vec4.scale(k2_2, k2, 1 / 2);// k2_2 = k2/2
            glMatrix.vec4.add(previous_plus_k2_2, previousPosition, k2_2);// previousPosition + k2/2     
            glMatrix.vec4.scale(k3, this.g(previous_plus_k2_2, signum), this.step_size);

            //CALCULATE: vec3 k4 = step_size * f(previousPosition + k3, signum);
            glMatrix.vec4.add(previous_plus_k3, previousPosition, k3);// previousPosition + k3
            glMatrix.vec4.scale(k4, this.g(previous_plus_k3, signum), this.step_size);

            //CALCULATE: vec3 currentPosition = previousPosition + k1 / 6 + k2 / 3 + k3 / 3 + k4 / 6;
            glMatrix.vec4.scale(k1_6, k1, 1 / 6);// k1_6 = k1/6
            glMatrix.vec4.scale(k2_3, k2, 1 / 3);// k2_3 = k2/3
            glMatrix.vec4.scale(k3_3, k3, 1 / 3);// k3_3 = k3/3
            glMatrix.vec4.scale(k4_6, k4, 1 / 6);// k4_6 = k4/6
            glMatrix.vec4.add(currentPosition, previousPosition, k1_6);// previousPosition + k1 / 6 
            glMatrix.vec4.add(currentPosition, currentPosition, k2_3);// previousPosition + k1 / 6 + k2 / 3
            glMatrix.vec4.add(currentPosition, currentPosition, k3_3);// previousPosition + k1 / 6 + k2 / 3 + k3 / 3
            glMatrix.vec4.add(currentPosition, currentPosition, k4_6);// previousPosition + k1 / 6 + k2 / 3 + k3 / 3 + k4 / 6

            //console.log(i, currentPosition);
            if (this.confine_to_cube)
                currentPosition = this.ConfineToCube(currentPosition, previousPosition);


            var flag = 2;//2=normal point   1=new polyline   3=end polyline   0=skip point
            var f_previous = this.g(previousPosition, signum);
            var f_current = this.g(currentPosition, signum);
            var v_previous = glMatrix.vec4.length(f_previous);
            var v_current = glMatrix.vec4.length(f_current);
            var v_average = (v_previous + v_current) * 0.5;
            var time_previous = raw_data.data[previousIndex].time;

            var difference = glMatrix.vec4.create();
            glMatrix.vec3.subtract(difference, currentPosition, previousPosition);
            var segment_length = glMatrix.vec4.length(difference);
            arc_length += segment_length;

            var time_current = time_previous + (segment_length / v_average);//var time_current = time_previous + (this.step_size / v_average);
            
            //set values of current index
            raw_data.data[currentIndex].position = glMatrix.vec4.fromValues(currentPosition[0], currentPosition[1], currentPosition[2], currentPosition[3]);
            raw_data.data[currentIndex].CalculateAngleFromPosition_3_2();
            raw_data.data[currentIndex].u_v_w_signum = glMatrix.vec4.fromValues(f_current[0], f_current[1], f_current[2], signum);
            raw_data.data[currentIndex].time = time_current;

            
            var flag_angle_jumping = false;
            if(snap_nearest_z){
                raw_data.data[currentIndex].SnapToOld(raw_data.data[previousIndex].angle);
            }
            else{
                //check if angle is jumping --> must start new line
                flag_angle_jumping = raw_data.data[currentIndex].IsAngleJumping(raw_data.data[previousIndex]);
                if(flag_angle_jumping){       
                    flag = 3;//end of polyline     
                    console.log("angle jumping: ", flag_angle_jumping, raw_data.data[previousIndex].angle, raw_data.data[currentIndex].angle);    
                    if(raw_data.data[currentIndex].angle > 0.5){
                        raw_data.data[currentIndex].angle -= 1;
                    }else{
                        raw_data.data[currentIndex].angle += 1;
                    }
                }
            }


            if (i == this.num_points_per_streamline - 1)
                flag = 3;//end of polyline

            var terminate = false;
            var flag_move_new_point = false;
            if (this.check_bounds) {
                var outOfBounds = this.CheckOutOfBounds2(currentPosition);
                if (outOfBounds) {
                    flag = 3;//end of polyline
                    //vectorPosition[currentIndex]= vec4(currentPosition, 3);//3 = end

                    if (this.continue_at_bounds) {
                        flag_move_new_point = true;
                    }
                    else {
                        terminate = true;
                    }
                }
            }

            //set correct flag of current index
            //default is 2 (normal point)
            //changed to 3 if last point of line or out of bounds
            raw_data.data[currentIndex].flag = flag;

            var flag_make_new_point = flag_move_new_point || flag_angle_jumping;
            if(this.AdditionalTerminationChecks(time_current, arc_length)){
                terminate = true;
                raw_data.data[currentIndex].flag = 3;//end of polyline
            }
            else if(flag_make_new_point && i < this.num_points_per_streamline - 2){
                var newPosition = glMatrix.vec4.create();
                glMatrix.vec4.copy(newPosition, currentPosition);
                if(flag_move_new_point){
                    newPosition = this.MoveOutOfBounds4(currentPosition);
                }
                var f_newPosition = this.g(newPosition, signum);
                var v_newPosition = glMatrix.vec4.length(f_newPosition);
                raw_data.data[currentIndex + 1].flag = signum;//1 or -1 for start
                raw_data.data[currentIndex + 1].position = glMatrix.vec4.fromValues(newPosition[0], newPosition[1], newPosition[2], newPosition[3]);;//1 or -1 for start
                raw_data.data[currentIndex + 1].CalculateAngleFromPosition_3_2();
                raw_data.data[currentIndex + 1].u_v_w_signum = glMatrix.vec4.fromValues(f_newPosition[0], f_newPosition[1], f_newPosition[2], signum);//TODO
                raw_data.data[currentIndex + 1].time = time_current;
                raw_data.data[currentIndex + 1].velocity = v_newPosition;
                i++;
                console.log("raw_data.data[currentIndex].position", i, raw_data.data[currentIndex].position[0] + " " + raw_data.data[currentIndex].position[1] + " " + raw_data.data[currentIndex].position[2] + " " + raw_data.data[currentIndex].position[3]);
                console.log("raw_data.data[currentIndex + 1].position", i, raw_data.data[currentIndex + 1].position[0] + " " + raw_data.data[currentIndex + 1].position[1] + " " + raw_data.data[currentIndex + 1].position[2] + " " + raw_data.data[currentIndex + 1].position[3]);
            }

            //terminate if nan or infinity
            var flag_finite = this.CheckFinite(raw_data.data[currentIndex].position);
            if(!flag_finite){
                console.log("flag_nan ", i, raw_data.data[currentIndex].position[0] + " " + raw_data.data[currentIndex].position[1] + " " + raw_data.data[currentIndex].position[2] + " " + raw_data.data[currentIndex].position[3]);
                console.log(raw_data.data[currentIndex-1].position[0])
                console.log(raw_data.data[currentIndex].position[0])
                //copy previous point with end flag
                //the copy makes sure that we stop at a valid position
                raw_data.data[currentIndex].flag = 3;//end of polyline
                glMatrix.vec4.copy(raw_data.data[currentIndex].position, raw_data.data[previousIndex].position);
                glMatrix.vec4.copy(raw_data.data[currentIndex].u_v_w_signum, raw_data.data[previousIndex].u_v_w_signum);
                raw_data.data[currentIndex].time = raw_data.data[previousIndex].time;

                terminate = true;
                console.log("flag_nan copied", i, raw_data.data[currentIndex].position[0] + " " + raw_data.data[currentIndex].position[1] + " " + raw_data.data[currentIndex].position[2] + " " + raw_data.data[currentIndex].position[3]);
                this.streamline_error_counter += 1;
            }

            //previousPosition = currentPosition;
            if (terminate)
                break;

            console.log("currentPosition", i, currentPosition[0] + " " + currentPosition[1] + " " + currentPosition[2] + " " + currentPosition[3]);
        }
        
        console.log("raw_data: ", raw_data);
    }


    f(vector, signum) {
        //console.log("--------------");
        //console.log("vector: ", vector, "test");
        //console.log("vector0: ", vector[0]);
        //console.log("vector1: ", vector[1]);
        //console.log("vector2: ", vector[2]);
        let scope = {
            x: vector[0],
            y: vector[1],
            z: vector[2],
        };
        //console.log("scope: ", scope);
        //console.log("this.shader_formula_u: ", this.shader_formula_u);
        var u = math.evaluate(this.shader_formula_u, scope)
        var v = math.evaluate(this.shader_formula_v, scope);
        var w = math.evaluate(this.shader_formula_w, scope);
        var result = glMatrix.vec3.create();
        result[0] = u * signum;
        result[1] = v * signum;
        result[2] = w * signum;
        return result;
    }

    g(vector, signum) {
        //this.shader_formula_a = "x^2";
        //this.shader_formula_b = "y^2";
        //console.log("--------------");
        //console.log("vector: ", vector, "test");
        //console.log("vector0: ", vector[0]);
        //console.log("vector1: ", vector[1]);
        //console.log("vector2: ", vector[2]);
        let scope = {
            x: vector[0],
            y: vector[1],
            v_x: vector[2],
            v_y: vector[3],
        };
        //console.log("scope: ", scope);
        //console.log("this.shader_formula_u: ", this.shader_formula_u);
        var u = vector[2];
        var v = vector[3];
        var a = math.evaluate(this.shader_formula_a, scope);
        var b = math.evaluate(this.shader_formula_b, scope);
        var result = glMatrix.vec4.create();
        result[0] = u * signum;
        result[1] = v * signum;
        result[2] = a * signum;
        result[3] = b * signum;
        return result;
    }

    CheckFinite(position){
        for(var i=0; i< position.length; i++){
            if(!Number.isFinite(position[i])){
                return false;
            }
        }
        return true;
    }

    CheckOutOfBounds3(position) {
        for (var i = 0; i < 3; i++)
            if (position[i] > 1 || position[i] < 0)
                return true;
        return false;
    }

    CheckOutOfBounds2(position) {
        for (var i = 0; i < 2; i++)
            if (position[i] > 1 || position[i] < 0)
                return true;
        return false;
    }

    MoveOutOfBounds3(position) {
        //user friendly variables
        var x = position[0];
        var y = position[1];
        var z = position[2];
        //additional "constant" variables for this calculation
        var x0 = x;
        var y0 = y;
        var z0 = z;

        let scope = {
            x: x,
            y: y,
            z: z,
        };

        if (x > 1) {
            scope.x = math.evaluate(this.shader_rule_x_pos_x, scope);
            scope.y = math.evaluate(this.shader_rule_x_pos_y, scope);
            scope.z = math.evaluate(this.shader_rule_x_pos_z, scope);
        }
        else if (x < 0) {
            scope.x = math.evaluate(this.shader_rule_x_neg_x, scope);
            scope.y = math.evaluate(this.shader_rule_x_neg_y, scope);
            scope.z = math.evaluate(this.shader_rule_x_neg_z, scope);
        }

        if (y > 1) {
            scope.x = math.evaluate(this.shader_rule_y_pos_x, scope);
            scope.y = math.evaluate(this.shader_rule_y_pos_y, scope);
            scope.z = math.evaluate(this.shader_rule_y_pos_z, scope);
        }
        else if (y < 0) {
            scope.x = math.evaluate(this.shader_rule_y_neg_x, scope);
            scope.y = math.evaluate(this.shader_rule_y_neg_y, scope);
            scope.z = math.evaluate(this.shader_rule_y_neg_z, scope);
        }

        if (z > 1) {
            scope.x = math.evaluate(this.shader_rule_z_pos_x, scope);
            scope.y = math.evaluate(this.shader_rule_z_pos_y, scope);
            scope.z = math.evaluate(this.shader_rule_z_pos_z, scope);
        }
        else if (z < 0) {
            scope.x = math.evaluate(this.shader_rule_z_neg_x, scope);
            scope.y = math.evaluate(this.shader_rule_z_neg_y, scope);
            scope.z = math.evaluate(this.shader_rule_z_neg_z, scope);
        }

        return glMatrix.vec3.fromValues(scope.x, scope.y, scope.z);
    }

    MoveOutOfBounds4(position) {
        console.log("MoveOutOfBounds4: "+position[0] + ", " + position[1] + ", " + position[2] + ", " + position[3]);
        //user friendly variables
        var x = position[0];
        var y = position[1];
        var v_x = position[2];
        var v_y = position[3];
        //additional "constant" variables for this calculation
        var x0 = x;
        var y0 = y;
        var v_x0 = v_x;
        var v_y0 = v_y;

        let scope = {
            x: x,
            y: y,
            v_x: v_x,
            v_y: v_y,
        };

        if (x > 1) {
            scope.x = math.evaluate(this.shader_rule_x_pos_x, scope);
            scope.y = math.evaluate(this.shader_rule_x_pos_y, scope);
            //scope.v_x = math.evaluate(this.shader_rule_x_pos_v_x, scope);
            //scope.v_y = math.evaluate(this.shader_rule_x_pos_v_y, scope);
        }
        else if (x < 0) {
            scope.x = math.evaluate(this.shader_rule_x_neg_x, scope);
            scope.y = math.evaluate(this.shader_rule_x_neg_y, scope);
            //scope.v_x = math.evaluate(this.shader_rule_x_neg_v_x, scope);
            //scope.v_y = math.evaluate(this.shader_rule_x_neg_v_y, scope);
        }

        if (y > 1) {
            scope.x = math.evaluate(this.shader_rule_y_pos_x, scope);
            scope.y = math.evaluate(this.shader_rule_y_pos_y, scope);
            //scope.v_x = math.evaluate(this.shader_rule_y_pos_v_x, scope);
            //scope.v_y = math.evaluate(this.shader_rule_y_pos_v_y, scope);
        }
        else if (y < 0) {
            scope.x = math.evaluate(this.shader_rule_y_neg_x, scope);
            scope.y = math.evaluate(this.shader_rule_y_neg_y, scope);
            //scope.v_x = math.evaluate(this.shader_rule_y_neg_v_x, scope);
            //scope.v_y = math.evaluate(this.shader_rule_y_neg_v_y, scope);
        }
        /*
        if (v_x > 1) {
            scope.x = math.evaluate(this.shader_rule_v_x_pos_x, scope);
            scope.y = math.evaluate(this.shader_rule_v_x_pos_y, scope);
            scope.v_x = math.evaluate(this.shader_rule_v_x_pos_v_x, scope);
            scope.v_y = math.evaluate(this.shader_rule_v_x_pos_v_y, scope);
        }
        else if (v_x < 0) {
            scope.x = math.evaluate(this.shader_rule_v_x_neg_x, scope);
            scope.y = math.evaluate(this.shader_rule_v_x_neg_y, scope);
            scope.v_x = math.evaluate(this.shader_rule_v_x_neg_v_x, scope);
            scope.v_y = math.evaluate(this.shader_rule_v_x_neg_v_y, scope);
        }

        if (v_y > 1) {
            scope.x = math.evaluate(this.shader_rule_v_y_pos_x, scope);
            scope.y = math.evaluate(this.shader_rule_v_y_pos_y, scope);
            scope.v_x = math.evaluate(this.shader_rule_v_y_pos_v_x, scope);
            scope.v_y = math.evaluate(this.shader_rule_v_y_pos_v_y, scope);
        }
        else if (v_y < 0) {
            scope.x = math.evaluate(this.shader_rule_v_y_neg_x, scope);
            scope.y = math.evaluate(this.shader_rule_v_y_neg_y, scope);
            scope.v_x = math.evaluate(this.shader_rule_v_y_neg_v_x, scope);
            scope.v_y = math.evaluate(this.shader_rule_v_y_neg_v_y, scope);
        }
        */
        return glMatrix.vec4.fromValues(scope.x, scope.y, scope.v_x, scope.v_y);
    }

    //vec3 currentPosition, previousPosition
    ConfineToCube(currentPosition, previousPosition) {
        //return currentPosition;
        var confine = false;
        var min_t = 1000000;
        for (var i = 0; i < 3; i++) {
            if (currentPosition[i] < 0) {
                confine = true;
                var t = this.ExtractLinearPercentage(previousPosition[i], currentPosition[i], 0);
                if (t < min_t)
                    min_t = t;
            }
            if (currentPosition[i] > 1) {
                confine = true;
                var t = this.ExtractLinearPercentage(previousPosition[i], currentPosition[i], 1);
                if (t < min_t)
                    min_t = t;
            }
        }

        if (confine) {
            //vec3 direction = currentPosition - previousPosition;
            var direction = glMatrix.vec3.create();
            glMatrix.vec3.subtract(direction, currentPosition, previousPosition);
            //vec3 direction_normalized = normalize(direction);
            var direction_normalized = glMatrix.vec3.create();
            glMatrix.vec3.normalize(direction_normalized, direction);
            //return previousPosition + min_t * direction + epsilon_move_just_outside_cube * direction_normalized;
            var result = glMatrix.vec3.clone(previousPosition);//previousPosition + ...
            var tmp = glMatrix.vec3.create();
            //... + min_t * direction + ...
            glMatrix.vec3.scale(tmp, direction, min_t)
            glMatrix.vec3.add(result, result, tmp);
            //... + epsilon_move_just_outside_cube * direction_normalized + ...
            glMatrix.vec3.scale(tmp, direction_normalized, this.epsilon_move_just_outside_cube)
            glMatrix.vec3.add(result, result, tmp);
            return result;

        }

        return currentPosition;
    }

    //float a, b, value
    ExtractLinearPercentage(a, b, value) {
        return (value - a) / (b - a);
    }

}

module.exports = StreamlineGenerator;