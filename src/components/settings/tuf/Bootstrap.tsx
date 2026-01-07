import React, { useState } from 'react';
import { StepStatus, TaskData } from './types';
import { getStatusColor, getStatusIcon, getTaskStateColor } from './utils';

interface BootstrapProps {
  selectedApp: string;
  isBootstrapSuccess: boolean;
  generatedPayload: string;
  step2Status: StepStatus;
  bootstrapTaskId: string;
  bootstrapLastUpdate: string;
  bootstrapStatus: TaskData | null;
  lastChecked: string;
  onStartBootstrap: (payload: string) => void;
}

export const Bootstrap: React.FC<BootstrapProps> = ({
  selectedApp,
  isBootstrapSuccess,
  generatedPayload,
  step2Status,
  bootstrapTaskId,
  bootstrapLastUpdate,
  bootstrapStatus,
  lastChecked,
  onStartBootstrap,
}) => {
  const [payloadSource, setPayloadSource] = useState<'generated' | 'custom'>('generated');
  const [customPayload, setCustomPayload] = useState<string>('');
  const [customPayloadError, setCustomPayloadError] = useState<string>('');

  const handleCustomPayloadChange = (value: string) => {
    setCustomPayload(value);
    setCustomPayloadError('');
    
    // Validate JSON on change
    if (value.trim()) {
      try {
        JSON.parse(value);
      } catch (e) {
        // Error will be shown on submit
      }
    }
  };

  const handleStartBootstrap = () => {
    let payloadToUse = '';
    
    if (payloadSource === 'generated') {
      if (!generatedPayload) {
        alert('Please generate keys first or use custom payload');
        return;
      }
      payloadToUse = generatedPayload;
    } else {
      if (!customPayload.trim()) {
        setCustomPayloadError('Custom payload is required');
        return;
      }
      
      // Validate JSON
      try {
        JSON.parse(customPayload);
        setCustomPayloadError('');
        payloadToUse = customPayload;
      } catch (e) {
        setCustomPayloadError('Invalid JSON format');
        return;
      }
    }
    
    onStartBootstrap(payloadToUse);
  };

  if (!selectedApp || isBootstrapSuccess) {
    return null;
  }

  return (
    <div className="bg-theme-card p-6 rounded-lg border border-theme-card-hover">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-theme-primary font-roboto">
          Step 2: Start TUF Bootstrapping
        </h2>
        <div className={`flex items-center ${getStatusColor(step2Status)}`}>
          <i className={`fas ${getStatusIcon(step2Status)} mr-2`}></i>
          <span className="text-sm capitalize">{step2Status.replace('-', ' ')}</span>
        </div>
      </div>

      {/* Info about root keys location */}
      <div className="mb-6 p-4 bg-blue-500 bg-opacity-10 border border-blue-500 rounded-lg">
        <div className="flex items-start">
          <i className="fas fa-info-circle text-blue-500 mr-3 mt-0.5 text-xl"></i>
          <div className="flex-1">
            <h3 className="text-blue-500 font-semibold mb-2 font-roboto">About Root Keys Location</h3>
            <p className="text-theme-primary text-sm leading-relaxed mb-2">
              <strong>Important:</strong> Root keys are <strong>not required</strong> to be in <code className="bg-theme-input px-1 rounded">ONLINE_KEY_DIR</code> for bootstrapping.
            </p>
            <p className="text-theme-primary text-sm leading-relaxed mb-2">
              <strong>Recommendation:</strong> It is recommended to download root keys locally and remove them from <code className="bg-theme-input px-1 rounded">ONLINE_KEY_DIR</code> for better security.
            </p>
            <p className="text-theme-primary text-sm leading-relaxed mb-2">
              The location of root keys only affects the choice between <strong>Online</strong> and <strong>Offline</strong> flow in the <strong>Rotate Root Keys</strong> section:
            </p>
            <ul className="text-theme-primary text-sm leading-relaxed list-disc list-inside ml-2 space-y-1">
              <li>If keys are kept in <code className="bg-theme-input px-1 rounded">ONLINE_KEY_DIR</code> → choose <strong>Online Flow</strong></li>
              <li>If keys are downloaded locally → choose <strong>Offline Flow</strong></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-theme-primary mb-2 font-roboto">Payload Source</label>
          <div className="space-y-2">
            {/* <label className="flex items-center">
              <input
                type="radio"
                name="payloadSource"
                value="generated"
                checked={payloadSource === 'generated'}
                onChange={(e) => setPayloadSource(e.target.value as 'generated' | 'custom')}
                disabled={!generatedPayload}
                className="mr-2"
              />
              <span className="text-theme-primary">
                Use generated payload (from Step 1)
                {!generatedPayload && <span className="text-gray-500 ml-2">(Not available)</span>}
              </span>
            </label> */}
            <label className="flex items-center">
              <input
                type="radio"
                name="payloadSource"
                value="custom"
                checked={payloadSource === 'custom'}
                onChange={(e) => setPayloadSource(e.target.value as 'generated' | 'custom')}
                className="mr-2"
              />
              <span className="text-theme-primary">Use custom payload</span>
            </label>
          </div>
        </div>

        {payloadSource === 'custom' && (
          <div>
            <label className="block text-theme-primary mb-2 font-roboto">Custom Payload</label>
            <textarea
              value={customPayload}
              onChange={(e) => handleCustomPayloadChange(e.target.value)}
              placeholder="Paste JSON payload here..."
              rows={8}
              className={`w-full bg-theme-input text-theme-primary border rounded-lg px-4 py-2 font-mono text-sm ${
                customPayloadError ? 'border-red-500' : 'border-theme'
              }`}
            />
            {customPayloadError && (
              <p className="text-red-500 text-sm mt-1">{customPayloadError}</p>
            )}
          </div>
        )}

        <button
          onClick={() => {
            console.log('[Bootstrap] Start Bootstrap button clicked, step2Status:', step2Status);
            handleStartBootstrap();
          }}
          disabled={step2Status === 'waiting' || step2Status === 'in-progress' || step2Status === 'disabled'}
          className="bg-theme-button-primary text-theme-primary px-4 py-2 rounded-lg font-roboto hover:bg-theme-button-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {step2Status === 'in-progress' ? (
            <>
              <i className="fas fa-spinner fa-spin mr-2"></i>
              Starting Bootstrap...
            </>
          ) : (
            <>
              <i className="fas fa-rocket mr-2"></i>
              Start Bootstrap
            </>
          )}
        </button>

        {bootstrapTaskId && (
          <div className="mt-4 p-4 bg-theme-input rounded-lg border border-theme">
            <div className="flex items-center justify-between mb-2">
              <span className="text-theme-primary font-semibold">Bootstrap Status</span>
              {lastChecked && (
                <span className="text-sm text-theme-primary opacity-70">
                  Last checked: {lastChecked}
                </span>
              )}
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-theme-primary opacity-70">Task ID: </span>
                <span className="text-theme-primary font-mono">{bootstrapTaskId}</span>
              </div>
              {bootstrapLastUpdate && (
                <div>
                  <span className="text-theme-primary opacity-70">Last Update: </span>
                  <span className="text-theme-primary">
                    {new Date(bootstrapLastUpdate).toLocaleString()}
                  </span>
                </div>
              )}
              {bootstrapStatus && (
                <div>
                  <span className="text-theme-primary opacity-70">Status: </span>
                  <span className={getTaskStateColor(bootstrapStatus.state)}>
                    {bootstrapStatus.state}
                  </span>
                  {bootstrapStatus.result && (
                    <div className="mt-2 pl-4 border-l-2 border-theme-card-hover">
                      <div className="text-theme-primary">{bootstrapStatus.result.message}</div>
                      {bootstrapStatus.result.error && (
                        <div className="text-red-500 mt-1">{bootstrapStatus.result.error}</div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
