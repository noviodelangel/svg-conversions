"use strict";
exports.__esModule = true;
exports.sos = void 0;
var data = [];
function sos() {
    // console.log('SOS')
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
    for (var _i = 0, data_1 = data; _i < data_1.length; _i++) {
        var row = data_1[_i];
        var line = '';
        line += row.id + ';';
        line += row.created_date_time + ';';
        line += JSON.stringify(row.status) + ';';
        line += JSON.stringify(row.reference) + ';';
        line += JSON.stringify(row.name) + ';';
        line += JSON.stringify(row.address) + ';';
        line += JSON.stringify((_a = row.address.line_1) !== null && _a !== void 0 ? _a : '') + ';';
        line += JSON.stringify((_b = row.address.line_2) !== null && _b !== void 0 ? _b : '') + ';';
        line += JSON.stringify((_c = row.address.line_3) !== null && _c !== void 0 ? _c : '') + ';';
        line += JSON.stringify(row.bank_account) + ';';
        line += JSON.stringify((_d = row.bank_account.number) !== null && _d !== void 0 ? _d : '') + ';';
        line += JSON.stringify((_e = row.bank_account.owner) !== null && _e !== void 0 ? _e : '') + ';';
        line += JSON.stringify((_f = row.bank_account.currency) !== null && _f !== void 0 ? _f : '') + ';';
        line += JSON.stringify((_g = row.bank_account.bank) !== null && _g !== void 0 ? _g : '') + ';';
        line += JSON.stringify((_j = (_h = row.bank_account.bank) === null || _h === void 0 ? void 0 : _h.name) !== null && _j !== void 0 ? _j : '') + ';';
        line += JSON.stringify((_l = (_k = row.bank_account.bank) === null || _k === void 0 ? void 0 : _k.country) !== null && _l !== void 0 ? _l : '') + ';';
        line += JSON.stringify((_o = (_m = row.bank_account.bank) === null || _m === void 0 ? void 0 : _m.bic) !== null && _o !== void 0 ? _o : '') + ';';
        line += JSON.stringify((_q = (_p = row.bank_account.bank) === null || _p === void 0 ? void 0 : _p.code) !== null && _q !== void 0 ? _q : '') + ';';
        line += JSON.stringify(row.type) + ';';
        line += JSON.stringify(row.default_transfer_reason);
        console.log(line);
    }
    // console.log(JSON.stringify(data[0].name))
    for (var key in data[0].name) {
        // console.log(key)
    }
}
exports.sos = sos;
