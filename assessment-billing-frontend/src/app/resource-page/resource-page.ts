import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Api, ApiRecord, ApiValue } from '../api';
import { ResourceConfig, ResourceField, ResourceKey, resourceConfigs } from '../resource-config';

@Component({
  selector: 'app-resource-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './resource-page.html',
  styleUrl: './resource-page.scss',
})
export class ResourcePage {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(Api);

  config!: ResourceConfig;
  items: ApiRecord[] = [];
  selectedItem: ApiRecord | null = null;
  formState: Record<string, string> = {};
  loading = false;
  saving = false;
  errorMessage = '';
  message = '';
  editingId: string | number | null = null;

  constructor() {
    this.route.paramMap.subscribe(params => {
      const resourceKey = params.get('resourceKey') as ResourceKey | null;
      const config = resourceKey ? resourceConfigs[resourceKey] : null;

      if (!config) {
        this.errorMessage = 'Unknown resource route.';
        return;
      }

      this.config = config;
      this.resetForm();
      this.loadItems();
    });
  }

  loadItems(): void {
    this.loading = true;
    this.errorMessage = '';

    this.api.list(this.config.endpoint).subscribe({
      next: response => {
        this.items = this.api.normalizeCollection(response);
        this.loading = false;
      },
      error: () => {
        this.items = [];
        this.loading = false;
        this.errorMessage = 'Unable to load records from this route.';
      },
    });
  }

  edit(item: ApiRecord): void {
    this.editingId = this.resolveItemId(item);
    this.selectedItem = item;
    this.formState = {};

    for (const field of this.config.fields) {
      this.formState[field.key] = this.formatFormValue(item[field.key]);
    }
  }

  inspect(item: ApiRecord): void {
    const itemId = this.resolveItemId(item);

    if (itemId === null) {
      this.selectedItem = item;
      return;
    }

    this.api.show(this.config.endpoint, itemId).subscribe({
      next: response => {
        this.selectedItem = this.api.normalizeRecord(response) ?? item;
      },
      error: () => {
        this.selectedItem = item;
      },
    });
  }

  save(): void {
    this.saving = true;
    this.errorMessage = '';
    this.message = '';

    const payload = this.buildPayload();
    const request = this.editingId === null
      ? this.api.create(this.config.endpoint, payload)
      : this.api.update(this.config.endpoint, this.editingId, payload);

    request.subscribe({
      next: () => {
        this.saving = false;
        this.message = this.editingId === null ? 'Record created successfully.' : 'Record updated successfully.';
        this.resetForm();
        this.loadItems();
      },
      error: () => {
        this.saving = false;
        this.errorMessage = 'Unable to save this record. Review field names against your backend validators.';
      },
    });
  }

  remove(item: ApiRecord): void {
    const itemId = this.resolveItemId(item);

    if (itemId === null) {
      this.errorMessage = 'This record does not expose an `id`, so delete cannot be sent.';
      return;
    }

    this.api.destroy(this.config.endpoint, itemId).subscribe({
      next: () => {
        this.message = 'Record deleted successfully.';
        if (this.selectedItem === item) {
          this.selectedItem = null;
        }
        this.loadItems();
      },
      error: () => {
        this.errorMessage = 'Unable to delete this record.';
      },
    });
  }

  resetForm(): void {
    this.editingId = null;
    this.message = '';
    this.formState = {};

    if (this.config) {
      for (const field of this.config.fields) {
        this.formState[field.key] = '';
      }
    }
  }

  valueFor(field: ResourceField): string {
    return this.formState[field.key] ?? '';
  }

  updateValue(fieldKey: string, value: string): void {
    this.formState[fieldKey] = value;
  }

  fieldsFor(item: ApiRecord): string[] {
    return Object.keys(item).filter(key => key !== 'id').slice(0, 5);
  }

  displayValue(value: ApiValue | undefined): string {
    if (Array.isArray(value)) {
      return value.join(', ');
    }

    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value);
    }

    if (value === null || value === undefined || value === '') {
      return '-';
    }

    return String(value);
  }

  detailEntries(): Array<{ key: string; value: string }> {
    if (!this.selectedItem) {
      return [];
    }

    return Object.entries(this.selectedItem).map(([key, value]) => ({
      key,
      value: this.displayValue(value),
    }));
  }

  endpointLabel(): string {
    return this.config.endpoint.replace(/^\/+/, '');
  }

  private buildPayload(): ApiRecord {
    const payload: ApiRecord = {};

    for (const field of this.config.fields) {
      const rawValue = this.formState[field.key]?.trim() ?? '';
      if (!rawValue) {
        continue;
      }

      payload[field.key] = field.type === 'number' ? Number(rawValue) : rawValue;
    }

    return payload;
  }

  private resolveItemId(item: ApiRecord): string | number | null {
    const id = item['id'];
    return typeof id === 'string' || typeof id === 'number' ? id : null;
  }

  private formatFormValue(value: ApiValue | undefined): string {
    if (Array.isArray(value)) {
      return value.join(', ');
    }

    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value);
    }

    return value === null || value === undefined ? '' : String(value);
  }
}
