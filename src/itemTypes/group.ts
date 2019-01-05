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

import * as groups from "@esri/arcgis-rest-groups";
import { IPagingParamsRequestOptions } from "@esri/arcgis-rest-groups";
import { IUserRequestOptions } from "@esri/arcgis-rest-auth";

import * as mCommon from "./common";
import { ITemplate } from "../interfaces";

// -- Externals ------------------------------------------------------------------------------------------------------//

// -- Create Bundle Process ------------------------------------------------------------------------------------------//

export function completeItemTemplate (
  itemTemplate: ITemplate,
  requestOptions?: IUserRequestOptions
): Promise<ITemplate> {
  return new Promise(resolve => {
    resolve(itemTemplate);
  });
}

export function getDependencyIds (
  itemTemplate: ITemplate,
  requestOptions?: IUserRequestOptions
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const pagingRequest:IPagingParamsRequestOptions = {
      paging: {
        start: 0,
        num: 100
      },
      ...requestOptions
    };

    // Fetch group items
    getGroupContentsTranche(itemTemplate.item.id, pagingRequest)
    .then(
      contents => resolve(contents),
      reject
    );
  });
}

export function convertToTemplate (
  itemTemplate: ITemplate
): Promise<void> {
  return new Promise(resolve => {

    // Common templatizations: item id, item dependency ids
    mCommon.doCommonTemplatizations(itemTemplate);

    resolve();
  });
}

// -- Deploy Bundle Process ------------------------------------------------------------------------------------------//

export function interpolateTemplate (
  itemTemplate: ITemplate,
  replacements: any
): Promise<ITemplate> {
  return new Promise((resolve, reject) => {
    resolve(itemTemplate);// //???
  });
}

export function handlePrecreateLogic (
  itemTemplate: ITemplate
): Promise<ITemplate> {
  return new Promise((resolve, reject) => {
    resolve(itemTemplate);// //???
  });
}

export function createItem (
  itemTemplate: ITemplate
): Promise<ITemplate> {
  return new Promise((resolve, reject) => {
    resolve(itemTemplate);// //???
  });
}

export function handlePostcreateLogic (
  itemTemplate: ITemplate
): Promise<ITemplate> {
  return new Promise((resolve, reject) => {
    resolve(itemTemplate);// //???
  });
}

// -- Internals ------------------------------------------------------------------------------------------------------//
// (export decoration is for unit testing)

/**
 * Gets the ids of a group's contents.
 *
 * @param id Group id
 * @param pagingRequest Options for requesting group contents; note: its paging.start parameter may
 *                      be modified by this routine
 * @return A promise that will resolve with a list of the ids of the group's contents
 * @protected
 */
export function getGroupContentsTranche (
  id: string,
  pagingRequest: IPagingParamsRequestOptions
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    // Fetch group items
    groups.getGroupContent(id, pagingRequest)
    .then(
      contents => {
        // Extract the list of content ids from the JSON returned
        const trancheIds:string[] = contents.items.map((item:any) => item.id);

        // Are there more contents to fetch?
        if (contents.nextStart > 0) {
          pagingRequest.paging.start = contents.nextStart;
          getGroupContentsTranche(id, pagingRequest)
          .then(
            (allSubsequentTrancheIds:string[]) => {
              // Append all of the following tranches to this tranche and return it
              resolve(trancheIds.concat(allSubsequentTrancheIds));
            },
            reject
          );
        } else {
          resolve(trancheIds);
        }
      },
      error => {
        reject(error.originalMessage);
      }
    );
  });
}
