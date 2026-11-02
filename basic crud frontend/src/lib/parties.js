// Customers and suppliers share the same screens; this is what differs
export const PARTIES = {
  customer: {
    label: 'Customer',
    plural: 'Customers',
    path: '/customers',
    api: '/customers',
    milkLabel: 'Milk given',
    paymentLabel: 'Payment received',
    balanceLabel: 'Owes you',
  },
  supplier: {
    label: 'Supplier',
    plural: 'Suppliers',
    path: '/suppliers',
    api: '/suppliers',
    milkLabel: 'Milk received',
    paymentLabel: 'Payment made',
    balanceLabel: 'You owe',
  },
}
