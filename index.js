
// Setup basic express server
var noble = require('noble');

var bufferpack = require('bufferpack');

//MyESP32 b4e62d88f29b
// var uu_id = 'b4e62d88f29b';
// var uu_id = 'b4e62d88f30f'; //notsoldered
// var uu_id = '30aea442cc12'; //go ride rev1 N1
var uu_id = '30aea4f00cda'; //go ride rev1 N2


//var uu_id = '7bea0849bae4'; //iphone

//b4e62d88f30f
//var uu_id = 'e7512198ae69'; //TODO: change it if need!!!

var service_ESP_0       = '4fafc2011fb5459e8fccc5c9c331914b';
var characterist_ESP_0  = 'beb5483e36e14688b7f5ea07361b26a8';

var characterist_ESP_1  = 'beb5483e36e14688b7f5ea07361b26aa';

// var service_id_r      = '6b943144075dd89ae6116cad4ac9b4a8';
// var characterist_ic_r = '6b943146075dd89ae6116cad4ac9b4a8';

// var service_id_m      = '6c943154075dd89ae6116cad4ac9b4a8';
// var characterist_ic_m = '6c943156075dd89ae6116cad4ac9b4a8';


var time0 = new Date().toLocaleTimeString(); // 11:18:48 AM
var date0 = new Date().toLocaleDateString(); // 11/16/2015
var time_log = date0 + "_" + time0;

console.log("FILE_index",time_log);

var fs = require('fs');

var file = null;

fs.open('./jstest_'+time_log+'.txt', 'a+', 777, function( e, id ) {
    file = id;
});

var packArray = [];
var timerId;
var timerId1;
var characteristicRead;
var characteristicWrite;

var fileLen = 0;
var packetLength = 0;
var flagForlost = 0;
var flagReload = 0;
var indexBuffer = [];
var fullFile = [];

function onReady(){
    var pack_cntr = 0;

    characteristicRead.on('data', function (data, isNotification) {
        var len_ = 0;
        var leftover = 0;
        let file_data = bufferpack.unpack('<I(numb)16s(str)', data, 0);

        console.log(file_data);
        
        var size_of_file = 0;

        if(file_data.numb == 0){
            if(flagForlost != 1){
                let file_data0 = bufferpack.unpack('<I(fileLength)', data, 4);
                fileLen = file_data0.fileLength;
                packetLength = parseInt(fileLen / 16);
                let temp = fileLen - packetLength*16;
                
                if(temp > 0){
                    packetLength += 1;
                }
                pack_cntr = 0;
                
                for (var i = 0 - 1; i < packetLength; i++) {
                    fullFile[i] = "????????????????"
                }
                for (var i = 0 - 1; i < packetLength; i++) {
                    indexBuffer[i] = null;
                }

                console.log("fileLen ", fileLen);
                if(fileLen == 0){
                    exit();
                }
                flagReload = 1;
            }
        }else{
            if(flagReload == 1){
                if(flagForlost != 1){
                    if(UniqueCheck(file_data.numb) == 0){
                        var cur_pos = file_data.numb*16 - 16;
                        cur_pos += 1;

                        fullFile[file_data.numb-1] = file_data.str;
                        packArray[pack_cntr] = file_data.numb;
                        pack_cntr += 1;
                        indexBuffer[file_data.numb] = 1; 
                    }
                    clearTimeout(timerId);
                    timerId = setTimeout(checkFileComlite, 2000);
                }else{
                    if(UniqueCheck(file_data.numb) == 0){
                        var cur_pos = file_data.numb*16 - 16;
                        cur_pos += 1;

                        fullFile[file_data.numb-1] = file_data.str;
                        packArray[pack_cntr] = file_data.numb;
                        pack_cntr += 1;
                        indexBuffer[file_data.numb] = 1; 
                    }
                }
            }else{
                process.nextTick(function(){
                    characteristicWrite.write(new Buffer([0x03]), true, function(error) {
                        console.log('RELOAD');
                        setTimeout(function() { 
                            characteristicWrite.write(new Buffer([0x01]), true, function(error) {
                            }); 
                        }, 500);
                     });
                });

            }
        }                                                                   
    });

    /* bugggggggggg */
    // characteristicRead.subscribe(function (err) {
    //     console.log('found characteristic subscribe ', err);
    // })

    characteristicWrite.write(new Buffer([0x01]), true, function(error) {
        console.log('writed');
    });  
}

function setWriteChar(charr){
    characteristicWrite = charr;
    if(characteristicRead && characteristicWrite){
        onReady();
    }
}
function setReadChar(charr){
    characteristicRead = charr;
    if(characteristicRead && characteristicWrite){
        onReady();
    }
}

function UniqueCheck(packNumb){
    for(var index = 0; index < packArray.length; index++){
        if(packArray[index] == packNumb){
            return 1;                }
    }
    return 0;
    console.log("UniqueCheck EROR");    
}    

function checkFileComlite(){
    console.log("FILE_packs received",packArray.length);
    console.log("FILE_STATS", packetLength);

    var testMy = [];
    for(var i = 1; i < indexBuffer.length; i++){
        if(indexBuffer[i] == null){
            testMy.push(i);
        }
    }
    console.log("testMy.length",testMy.length);
    console.log("testMy",testMy);

    if(testMy.length != 0){
        flagForlost = 1;
        console.log("***ERROR***");
        console.log("***Trying for get lost packets***");

        var values = [0x02,testMy[0]];
        var format = '<B(first)I(second)';
        var packed = bufferpack.pack(format, values);

        characteristicWrite.write(new Buffer(packed), true, function(error){
            clearTimeout(timerId1);
            timerId1 = setTimeout(checkFileComlite, 50);
            console.log("PACKETS NOT RECEIVED : ", testMy);    
        });      
    } else {
        flagForlost = 0;
        var tempFile = fullFile.join("");

        fs.write( file, tempFile.replace(/\0/g, ''), 1, 'utf8', function(){                
        });
        console.log("**CHECK_OK**");
        exit();
    }

}


noble.on('stateChange', function (state) {
    console.log(state);

    if (state === 'poweredOn') {
        console.log('scanning...');
        noble.startScanning([], false);
    }
    else {
        noble.stopScanning();
        console.log('stop_scanning...');
    }
});

noble.on('discover', function (peripheral) {
    console.log('Find: ', peripheral.advertisement.localName, peripheral.uuid);
    if (peripheral.uuid == uu_id) {
        noble.stopScanning();
        peripheral.on('disconnect', function () {
            noble.startScanning();
        });

        peripheral.connect(function (err) {
            console.log('connected: ', peripheral.advertisement.localName, peripheral.uuid);

            peripheral.discoverServices([], function (err, services) {

                services.forEach(function (service) {

                    console.log('found service:', service.uuid);
                    service.discoverCharacteristics([], function (err, characteristics) {
                        characteristics.forEach(function (characteristic) {
                            console.log('found characteristic:', characteristic.uuid);

                            if(characteristic.uuid == characterist_ESP_0){
                                setReadChar(characteristic);
                                console.log("setReadChar done");
                            }

                            if(characteristic.uuid == characterist_ESP_1){
                                setWriteChar(characteristic);
                                console.log("setWriteChar done");
                            }
                        })
                    })
                })
            })
        })
    }
});


function exit() {
    console.log("EXIT, FILE ENDED");
    var delayInMilliseconds = 1000; //1 second

    setTimeout(function() {
        fs.close(file);
        //your code to be executed after 1 second
        //return process.exit(process.pid);
        return process.kill(process.pid);
    }, delayInMilliseconds);
}