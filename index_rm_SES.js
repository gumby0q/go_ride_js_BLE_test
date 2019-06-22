
// Setup basic express server
var noble = require('noble');

var bufferpack = require('bufferpack');

//MyESP32 b4e62d88f29b
// var uu_id = 'b4e62d88f29b';
//var uu_id = 'b4e62d88f30f'; //notsoldered
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


// var time0 = new Date().toLocaleTimeString(); // 11:18:48 AM
// var date0 = new Date().toLocaleDateString(); // 11/16/2015
// var time_log = date0 + "_" + time0;

// console.log("FILE_index",time_log);

// var fs = require('fs');

// var file = null;

// fs.open('/home/anatolii/jsBLE/jstest_'+time_log+'.txt', 'a+', 777, function( e, id ) {
//     file = id;
// });

// var packArray = [];
// var timerId;
// var timerId1;
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
    // characteristicRead.subscribe(function (err) {
    //     console.log('found characteristic subscribe ', err);
    // })

    characteristicWrite.write(new Buffer([0x07]), true, function(error) {   // return sizz of SES
        console.log('writed 0x07');
        characteristicWrite.write(new Buffer([0x06]), true, function(error) {   // delete SES
            console.log('writed 0x06');
        });
    });
    
    //exit();
    
    characteristicRead.on('data', function (data, isNotification) {
        var len_ = 0;
        var leftover = 0;
        let file_data = bufferpack.unpack('<I(numb)16s(str)', data, 0);

        console.log("data", data);

        console.log(file_data);
        
        var size_of_file = 0;

        if(file_data.numb == 0){
            //if(flagForlost != 1){
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

                console.log("fileLen ",fileLen);
                //flagReload = 1;
            //}
        }else{

        }                                                                   
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
                                console.log("GOT IT!!!");
                            }

                            if(characteristic.uuid == characterist_ESP_1){
                                setWriteChar(characteristic);
                                characteristicWrite = characteristic;
                                console.log("dddd");
                                
                            }
                        })
                    })
                })
            })
        })
    }
});


function exit() {
    console.log("EXIT");
    var delayInMilliseconds = 1000; //1 second

    setTimeout(function() {
        //fs.close(file);
        //your code to be executed after 1 second
        //return process.exit(process.pid);
        return process.kill(process.pid);
    }, delayInMilliseconds);
}