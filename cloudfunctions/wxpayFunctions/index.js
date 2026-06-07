const makeOrder = require('./wxpay_order/index');
const queryOrderByOutTradeNo = require('./wxpay_query_order_by_out_trade_no/index');
const queryOrderByTransactionId = require('./wxpay_query_order_by_transaction_id/index');
const refund = require('./wxpay_refund/index');
const refundQuery = require('./wxpay_refund_query/index');

// 云函数入口函数
exports.main = async (event, context) => {
    // event.data 包含业务字段，需要解包传给子模块
    const bizData = event.data || {};
    switch (event.type) {
        case 'wxpay_order':
            return await makeOrder.main(bizData, context);
        case 'wxpay_query_order_by_out_trade_no':
            return await queryOrderByOutTradeNo.main(bizData, context);
        case 'wxpay_query_order_by_transaction_id':
            return await queryOrderByTransactionId.main(bizData, context);
        case 'wxpay_refund':
            return await refund.main(bizData, context);
        case 'wxpay_refund_query':
            return await refundQuery.main(bizData, context);
        default:
            return {
                code: -1,
                msg: 'Unimplemented method'
            };
    }
};

