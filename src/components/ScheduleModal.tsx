import React from 'react';
import { CalendarDays } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Entity } from '@/types/entity';
import { stateRequirements } from '@/lib/state-requirements';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  entities: Entity[];
}

export const ScheduleModal: React.FC<ScheduleModalProps> = ({
  isOpen,
  onClose,
  entities
}) => {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  if (entities.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-info" />
              Entity Fee Schedule
            </DialogTitle>
          </DialogHeader>

          <div className="text-center py-16">
            <div className="mx-auto max-w-sm">
              <div className="rounded-full bg-muted p-8 w-fit mx-auto mb-4">
                <CalendarDays className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No entities to schedule</h3>
              <p className="text-muted-foreground">
                Add entities to see the fee schedule timeline.
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-info" />
            Entity Fee Schedule - 2025
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-border text-sm">
            <thead>
              <tr className="bg-muted">
                <th className="border border-border p-3 text-left font-semibold min-w-[250px]">
                  Entity / Fee Type
                </th>
                {months.map((month, index) => (
                  <th key={month} className="border border-border p-2 text-center font-semibold bg-primary-muted">
                    {month}
                  </th>
                ))}
                <th className="border border-border p-3 text-center font-semibold bg-success-muted">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {entities.map((entity, entityIndex) => (
                <React.Fragment key={entity.id}>
                  {/* Entity Renewal Fee */}
                  <tr className={entityIndex % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                    <td className="border border-border p-3 font-medium">
                      {entity.name} - Entity Renewal
                    </td>
                    {months.map((_, monthIndex) => (
                      <td key={monthIndex} className="border border-border p-2 text-center">
                        {monthIndex === 2 ? (
                          <div className="text-xs font-medium text-success px-1 py-0.5 bg-success-muted rounded">
                            ${stateRequirements[entity.state][entity.type].fee}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                    ))}
                    <td className="border border-border p-3 text-center font-semibold text-success">
                      ${stateRequirements[entity.state][entity.type].fee}
                    </td>
                  </tr>

                  {/* Registered Agent Fee */}
                  {entity.registeredAgent.fee > 0 && (
                    <tr className={entityIndex % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                      <td className="border border-border p-3 font-medium">
                        {entity.name} - Registered Agent
                      </td>
                      {months.map((_, monthIndex) => (
                        <td key={monthIndex} className="border border-border p-2 text-center">
                          {monthIndex === 0 ? (
                            <div className="text-xs font-medium text-primary px-1 py-0.5 bg-primary-muted rounded">
                              ${entity.registeredAgent.fee}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                      ))}
                      <td className="border border-border p-3 text-center font-semibold text-primary">
                        ${entity.registeredAgent.fee}
                      </td>
                    </tr>
                  )}

                  {/* Independent Director Fee */}
                  {entity.state === 'DE' && entity.independentDirector.fee > 0 && (
                    <tr className={entityIndex % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                      <td className="border border-border p-3 font-medium">
                        {entity.name} - Independent Director
                      </td>
                      {months.map((_, monthIndex) => (
                        <td key={monthIndex} className="border border-border p-2 text-center">
                          {monthIndex === 0 ? (
                            <div className="text-xs font-medium text-info px-1 py-0.5 bg-info-muted rounded">
                              ${entity.independentDirector.fee}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                      ))}
                      <td className="border border-border p-3 text-center font-semibold text-info">
                        ${entity.independentDirector.fee}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end mt-6">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};