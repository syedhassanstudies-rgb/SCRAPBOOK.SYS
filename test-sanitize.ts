import { sanitizeData } from './src/lib/utils';
console.log('Test 1:', sanitizeData({ 'data.posterUrl': undefined }));
console.log('Test 2:', sanitizeData({ style: { y: undefined } }));
console.log('Test 3:', sanitizeData([undefined]));
console.log('Test 4:', sanitizeData(undefined));
