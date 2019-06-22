
// Setup basic express server
var noble = require('noble');

var bufferpack = require('bufferpack');

//MyESP32 b4e62d88f29b
// var uu_id = 'b4e62d88f29b';
//var uu_id = 'b4e62d88f30f'; //notsoldered
// var uu_id = '30aea442cc12'; //go ride rev1 N1
var uu_id = '30aea4f00cda'; //go ride rev1 N2
// var uu_id = '4b5e28a4aef8'; //iphone


//var uu_id = '7bea0849bae4'; //iphone

//var uu_id = 'e7512198ae69'; //TODO: change it if need!!!

var service_ESP_0       = '4fafc2011fb5459e8fccc5c9c331914b';
var characterist_ESP_0  = 'beb5483e36e14688b7f5ea07361b26a8';

var characterist_ESP_1  = 'beb5483e36e14688b7f5ea07361b26aa';

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
    //[0x04,0x00,0x00,0x01,0x02,0x03,0x04,0x05,0x06,0x07,0x08,0x09,0x0a,0x0b,0x0c,0x0d,0x0e,0x0f]
    
    var values = [0x04,0x00,10007638,-100005250,102520001,-1005550001];     //for startfinish
    var values1 = [0x04,0x01,100076,-1000768,1000762,-1000768];             //for sectors
    var values2 = [0x04,0x02,1000,-1000,1000,-1000];
    var values3 = [0x04,0x03,1000313,-1000313,1000313,-1000313];

    var format = '<B(first)B(second)l(third)l(fourth)l(fiveth)l(sixth)';
    var packet = bufferpack.pack(format, values);
    var packet1 = bufferpack.pack(format, values1);
    var packet2 = bufferpack.pack(format, values2);
    var packet3 = bufferpack.pack(format, values3);

    console.log(packet);
    characteristicWrite.write(new Buffer(packet), true, function(error) {
       console.log('writed');
    });
    characteristicWrite.write(new Buffer(packet1), true, function(error) {
       console.log('writed1');
    });
    characteristicWrite.write(new Buffer(packet2), true, function(error) {
       console.log('writed2');
    });
    characteristicWrite.write(new Buffer(packet3), true, function(error) {
       console.log('writed3');
    });
    characteristicWrite.write(new Buffer([0x05]), true, function(error) {   //save into file
       console.log('writed 0x05');
    });
    //exit();
    
    // characteristicRead.on('data', function (data, isNotification) {
    //     var len_ = 0;
    //     var leftover = 0;
    //     let file_data = bufferpack.unpack('<I(numb)16s(str)', data, 0);

    //     console.log("data", data);

    //     console.log(file_data);
        
    //     var size_of_file = 0;

    //     if(file_data.numb == 0){
    //         //if(flagForlost != 1){
    //             let file_data0 = bufferpack.unpack('<I(fileLength)', data, 4);
    //             fileLen = file_data0.fileLength;
    //             packetLength = parseInt(fileLen / 16);
    //             let temp = fileLen - packetLength*16;
                
    //             if(temp > 0){
    //                 packetLength += 1;
    //             }
    //             pack_cntr = 0;
                
    //             for (var i = 0 - 1; i < packetLength; i++) {
    //                 fullFile[i] = "????????????????"
    //             }
    //             for (var i = 0 - 1; i < packetLength; i++) {
    //                 indexBuffer[i] = null;
    //             }

    //             console.log("fileLen ",fileLen);
    //         //}
    //     }else{

    //     }                                                                   
    // });    
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
                                characteristicWrite = characteristic;
                                setWriteChar(characteristic);
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