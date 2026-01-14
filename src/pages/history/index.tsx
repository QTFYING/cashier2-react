import { Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';

interface DataType {
  key: string;
  id: string;
  amount: number;
  currency: string;
  status: string;
  date: string;
}

const columns: ColumnsType<DataType> = [
  {
    title: 'Transaction ID',
    dataIndex: 'id',
    key: 'id',
    render: (text) => <a>{text}</a>,
  },
  {
    title: 'Amount',
    dataIndex: 'amount',
    key: 'amount',
  },
  {
    title: 'Currency',
    dataIndex: 'currency',
    key: 'currency',
  },
  {
    title: 'Status',
    key: 'status',
    dataIndex: 'status',
    render: (_, { status }) => {
      let color = status === 'Completed' ? 'green' : 'geekblue';
      if (status === 'Failed') {
        color = 'volcano';
      }
      return (
        <Tag color={color} key={status}>
          {status.toUpperCase()}
        </Tag>
      );
    },
  },
  {
    title: 'Date',
    dataIndex: 'date',
    key: 'date',
  },
  {
    title: 'Action',
    key: 'action',
    render: (_, _record) => (
      <Space size="middle">
        <a>View Details</a>
      </Space>
    ),
  },
];

const data: DataType[] = [
  {
    key: '1',
    id: 'TXN-001',
    amount: 3200.0,
    currency: 'USD',
    status: 'Completed',
    date: '2023-10-01',
  },
  {
    key: '2',
    id: 'TXN-002',
    amount: 42.5,
    currency: 'EUR',
    status: 'Pending',
    date: '2023-10-02',
  },
  {
    key: '3',
    id: 'TXN-003',
    amount: 100.0,
    currency: 'USD',
    status: 'Failed',
    date: '2023-10-03',
  },
];

const TransactionHistory = () => {
  return (
    <div>
      <h2 className="mb-6">Transaction History</h2>
      <Table columns={columns} dataSource={data} />
    </div>
  );
};

export default TransactionHistory;
