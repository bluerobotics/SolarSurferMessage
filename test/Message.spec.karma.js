// hack for Travis-CI, not sure why $ isn't registered automatically
$ = window.jQuery;

describe('Message', function(){
  beforeEach(function(){
    jasmine.getJSONFixtures().fixturesPath='base/src';
    var config = getJSONFixture('formats.json');
    Message.configure(config);
  });

  it('should load the formats file', function(){
    expect(Message.formats[0].name).toBe('test/string');
  });

  // it('should encode this object', function(){
  //   var data = {
  //     _version: 2,
  //     _format: 4,
  //     telemetryPeriod: '10',
  //     forceMode: { ThrusterOff: false, ForceHeading: false, ForceHoldPosition: false },
  //     forceHeading: 14.0625,
  //     goalVoltage: 13.201,
  //     forceCurrentWaypointIndex: 3,
  //     waypointID1: 0,
  //     waypointRadius1: 0,
  //     waypointLat1: 0,
  //     waypointLon1: 0,
  //     waypointID2: 0,
  //     waypointRadius2: 0,
  //     waypointLat2: 0,
  //     waypointLon2: 0,
  //     waypointID3: 0,
  //     waypointRadius3: 0,
  //     waypointLat3: 0,
  //     waypointLon3: 0,
  //     waypointID4: 0,
  //     waypointRadius4: 0,
  //     waypointLat4: 0,
  //     waypointLon4: 0
  //   };

  //   // this should not throw an error
  //   var packet = window.Message.encode(data);

  //   expect(packet).toBe('020403000a91330300000000000000000000000000000000000000000000000000000000000000000000000000000000ef82');
  // });
});
