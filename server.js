	var http = require('http'),
		socketio = require("socket.io"),
		fs = require('fs');
		var app = http.createServer(function(req, resp){		
		fs.readFile("chat_room.html", function(err, data){		
			if(err) return resp.writeHead(500);
			resp.writeHead(200);
			resp.end(data);
		});
	});
	app.listen(3456);	
	var corresponding={};
	var temp_room=["main room"];
	var leaders={};
	var room_password={};
	var io = socketio.listen(app);
	var w1={};
	var w2={};
	var p1={};
	io.sockets.on("connection", function(socket){
		socket.on('msg_server', function(data) {
			var msg1=data.msg;
			console.log("message: "+msg1); 
			io.sockets.emit("msg_client",{msg:msg1, un:data.un}); 
		});

		socket.on('new', function(data) {
			socket.username =data.un;
			socket.room = 'main room';
			corresponding[data.un]=socket.room;
			socket.join('main room');
			room_password['main room']="";
			console.log("new user :"+data.un+" just entered the room");
			io.sockets.emit('add', {temp_room:temp_room});
			io.sockets.emit('update', {un:data.un});
			io.sockets.in(socket.room).emit('show_all', {present:socket.room,all:corresponding });
		});

		socket.on('build', function(data) {
			var rn=data.rn;
			var pw=data.rp;
			var oe=data.oe;
			temp_room.push(rn);
			room_password[rn]=pw;
			leaders[rn]=oe;
			console.log("new room created: "+rn); 
			io.sockets.emit("add",{temp_room:temp_room});
		});		

		socket.on('enter', function(data) {
			var rn=data.enter_room_name;
			var pri=socket.room;
			
			socket.leave(socket.room);
			socket.room=rn;
            socket.join(rn);
            console.log(socket.room);
            corresponding[socket.username] = rn;
			io.sockets.emit('update', {un:socket.username});
			io.sockets.in(socket.room).emit('show_all', {present:socket.room, all:corresponding});
			io.sockets.in(pri).emit('show_all', {present:pri,all:corresponding });
			
		});
		
		socket.on('fp', function(data) {
			var rn=data.rn;
			var pw=room_password[rn];
			socket.emit("enter_cr", {rn:rn,pw:pw});
		});
		
		
		socket.on('kicks', function(data) {
			var e=data.e;
			var uk=data.uk;
			var rn1=corresponding[uk];
			if(e==leaders[rn1]){
				io.sockets.in(rn1).emit('kicku', {ku:uk});
				corresponding[uk] = 'main room';
			}
			else{
				io.sockets.emit("kicke",{sender:rn1});
			}
		});
		
		socket.on('bans', function(data) {
			var e=data.e;
			var ub=data.ub;
			var rn1=corresponding[ub];
			if(e==leaders[rn1]){
				io.sockets.in(rn1).emit('banu', {bu:ub,br:rn1});
				corresponding[ub] = 'main room';
			}
			else{
				io.sockets.emit("bane",{sender:rn1});
			}
		});
		
		socket.on('pri_msg', function(data) {
			var receiver=data.receiver;
			var msg2=data.msg;
			var sender=data.sender;
			if(corresponding[receiver]!==corresponding[sender]){
				io.sockets.emit("private_send_error",{sender:sender});
			}
			else{
				console.log("message: "+msg2); 
				io.sockets.emit("private_send",{message:msg2, sender:sender, receiver:receiver});
			}
		});

		socket.on('cp', function(data) {
			var pc=data.pc;
			var rc=data.rc;
			var u1=data.un;
			if(u1==leaders[rc]){
				room_password[rc]=pc;
				io.sockets.in(rc).emit('cp',{owner:u1,room:rc});
			}
			else{
				io.sockets.emit("cp_error",{sender:u1});
			}
		});
		
		socket.on('profile', function(data) {
			var username1=data.username;
			var profile1=data.profile1;
			var profile2=data.profile2;
			var whe1=data.whe1;
			var whe2=data.whe2;
			w1[username1]=whe1;
			w2[username1]=whe2;
			p1[username1]=profile1;
			io.sockets.emit("view",{profile:profile1,username:username1,whe1:whe1,whe2:whe2});
		});

		socket.on('query', function(data) {
			var un1=data.un1;
			var un_real=data.username;
			var wh1=w1[un1];
			var wh2=w2[un1];
			var p2=p1[un1];
			io.sockets.emit("query1",{un1:un1,username:un_real,wh1:wh1,wh2:wh2,p2:p2});
			// io.sockets.in(socket.username).emit('query1',{un1:un1});
		});
		
	});
	
	
	
	