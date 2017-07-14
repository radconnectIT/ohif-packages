import { Meteor } from 'meteor/meteor';
import { HangingProtocols } from 'meteor/ohif:hanging-protocols-base';

MatchedProtocols = new Meteor.Collection(null);
MatchedProtocols._debugName = 'MatchedProtocols';

Comparators = new Meteor.Collection(null);
Comparators._debugName = 'Comparators';

HangingProtocols.utils.comparators.forEach(item => {
    Comparators.insert(item);
});
