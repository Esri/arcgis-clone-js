/*
 | Copyright 2018 Esri
 |
 | Licensed under the Apache License, Version 2.0 (the "License");
 | you may not use this file except in compliance with the License.
 | You may obtain a copy of the License at
 |
 |    http://www.apache.org/licenses/LICENSE-2.0
 |
 | Unless required by applicable law or agreed to in writing, software
 | distributed under the License is distributed on an "AS IS" BASIS,
 | WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 | See the License for the specific language governing permissions and
 | limitations under the License.
 */

 import { IUserRequestOptions } from "@esri/arcgis-rest-auth";

// -- Externals ------------------------------------------------------------------------------------------------------//

/**
 * An AGOL item for serializing.
 */
export interface ITemplate {
  /**
   * Item's AGOL id
   */
  itemId: string;
  /**
   * AGOL item type name
   */
  type: string;
  /**
   * Camelized form of item title used as an identifier
   */
  key: string;
  /**
   * Item base section JSON
   */
  item: any;
  /**
   * Item data section JSON
   */
  data?: any;
  /**
   * Item resources section JSON
   */
  resources?: any[];
  /**
   * List of ids of AGOL items needed by this item
   */
  dependencies?: string[];
  /**
   * Miscellaneous item-specific properties
   */
  properties?: any;
  /**
   * Item-type-specific functions
   */
  fcns?: IItemTypeModule
}

export interface IItemTypeModule {
  completeItemTemplate(itemTemplate:ITemplate, requestOptions?: IUserRequestOptions): Promise<ITemplate>;
  getDependencyIds(itemTemplate:ITemplate, requestOptions?: IUserRequestOptions): Promise<string[]>;

  deployItem(itemTemplate:ITemplate, folderId:string, settings:any, requestOptions:IUserRequestOptions):
    Promise<ITemplate>;
}
