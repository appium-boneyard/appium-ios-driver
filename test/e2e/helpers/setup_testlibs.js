import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import 'colors';

chai.use(chaiAsPromised);
chai.should();

global.expect = chai.expect;
