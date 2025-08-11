import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '../../../components/ui/Card.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { getFlags, setFlag, getRecentExposures } from '../api/index.js';

export default function AdminCard(){
  const [flags, setFlags] = useState({});
  const [exposures, setExposures] = useState([]);

  useEffect(()=>{ (async()=>{
    setFlags(await getFlags());
    setExposures(await getRecentExposures(10));
  })(); },[]);

  async function toggleThompson(){
    const next = !flags.pricing_thompson_enabled;
    await setFlag('pricing_thompson_enabled', next);
    setFlags(prev => ({ ...prev, pricing_thompson_enabled: next }));
  }

  return (
    <Card>
      <CardHeader><CardTitle>Admin</CardTitle></CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-center gap-3">
          <div>Thompson Strategy</div>
          <Button variant="outline" onClick={toggleThompson}>{flags.pricing_thompson_enabled? 'Enabled':'Disabled'}</Button>
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">Recent Exposures</div>
          <div className="grid grid-cols-4 text-xs font-medium text-gray-500">
            <div>SKU</div><div>Model</div><div className="text-right">Price</div><div className="text-right">ts</div>
          </div>
          {exposures.map((e,i)=> (
            <div key={i} className="grid grid-cols-4 items-center py-1 border-b last:border-b-0 text-sm">
              <div>{e.sku}</div>
              <div>{e.model||'-'}</div>
              <div className="text-right">${e.price}</div>
              <div className="text-right">{new Date(e.ts).toLocaleTimeString()}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}