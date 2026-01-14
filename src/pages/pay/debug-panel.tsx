import { Card } from 'antd';
import { FC } from 'react';

interface DebugPanelProps {
  isCreated: boolean;
  result: any;
}

export const DebugPanel: FC<DebugPanelProps> = ({ isCreated, result }) => {
  return (
    <Card title="调试信息" className="shadow-sm">
      <div className="max-h-64 overflow-y-auto bg-gray-50 p-4 rounded border border-gray-100">
        {isCreated && result ? (
          <pre className="text-xs whitespace-pre-wrap m-0 font-mono text-gray-600">{JSON.stringify(result, null, 2)}</pre>
        ) : (
          <span className="text-gray-400 text-xs">暂无调试数据</span>
        )}
      </div>
    </Card>
  );
};
