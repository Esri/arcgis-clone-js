/** @license
 * Copyright 2021 Esri
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Provides a function for deleting a deployed Solution item and all of the items that were created
 * as part of that deployment.
 *
 * @module deleteSolution
 */

import {
  EItemProgressStatus,
  SItemProgressStatus,
  IBuildOrdering,
  IDeleteSolutionOptions,
  IItemGeneralized,
  IItemTemplate,
  ISolutionItemData,
  UserSession
} from "./interfaces";
import * as portal from "@esri/arcgis-rest-portal";
import * as dependencies from "./dependencies";
import * as restHelpers from "./restHelpers";
import * as restHelpersGet from "./restHelpersGet";
import * as templatization from "./templatization";

// ------------------------------------------------------------------------------------------------------------------ //

/**
 * Deletes a deployed Solution item and and all of the items that were created
 * as part of that deployment.
 *
 * @param solutionItemId Id of a deployed Solution
 * @param authentication Credentials for the request
 * @return Promise that will resolve if deletion was successful and fail if any part of it failed;
 * note that Solution item will only be deleted if all of its deployed items were deleted so that
 * deletion can be re-attempted
 */
export function deleteSolution(
  solutionItemId: string,
  authentication: UserSession,
  options?: IDeleteSolutionOptions
): Promise<boolean> {
  const deleteOptions: IDeleteSolutionOptions = options || {};
  let progressPercentStep = 0;
  let percentDone = 0;

  return Promise.all([
    restHelpersGet.getItemBase(solutionItemId, authentication),
    restHelpersGet.getItemDataAsJson(solutionItemId, authentication)
  ])
    .then((response: any) => {
      const itemBase: IItemGeneralized = response[0];
      const itemData: ISolutionItemData = response[1];

      // Make sure that the item is a deployed Solution
      if (
        !(
          itemBase.typeKeywords.includes("Solution") &&
          itemBase.typeKeywords.includes("Deployed")
        )
      ) {
        throw new Error(
          "Item " + solutionItemId + " is not a deployed Solution"
        );
      }

      // Deletion path depends on version of deployed solution
      let buildOrderIds = [] as string[];
      const deployedSolutionVersion = templatization.extractSolutionVersion(
        itemData
      );
      if (deployedSolutionVersion < 1) {
        // Version 0
        buildOrderIds = _reconstructBuildOrderIds(itemData.templates);
      } else {
        // Version ≥ 1
        buildOrderIds = itemData.templates.map(
          (template: any) => template.itemId
        );
      }

      // Reverse the build order to get the delete order
      const deleteOrderIds = buildOrderIds.reverse();

      // Delete the items
      progressPercentStep = 100 / (deleteOrderIds.length + 2); // one extra for starting plus one extra for solution itself
      _reportProgress((percentDone += progressPercentStep), deleteOptions); // let the caller know that we've started

      return _removeItems(
        deleteOrderIds,
        authentication,
        percentDone,
        progressPercentStep,
        deleteOptions
      );
    })
    .then(allItemsSuccessfullyDeleted => {
      return new Promise<boolean>(resolve => {
        if (allItemsSuccessfullyDeleted) {
          // All items were deleted, so OK to delete Solution item
          restHelpers
            .removeItem(solutionItemId, authentication)
            .then(response => {
              if (response.success) {
                _reportProgress(
                  100,
                  deleteOptions,
                  solutionItemId,
                  EItemProgressStatus.Finished
                );
                resolve(true);
              } else {
                throw new Error();
              }
            })
            .catch(() => {
              _reportProgress(
                100,
                deleteOptions,
                solutionItemId,
                EItemProgressStatus.Failed
              );
              resolve(false);
            });
        } else {
          // Not all items were deleted, so don't delete solution
          _reportProgress(100, deleteOptions, "", EItemProgressStatus.Finished);
          resolve(false);
        }
      });
    })
    .catch(error => {
      throw error.message;
    });
}

/**
 * Reconstructs the build order of a set of templates.
 *
 * @param templates A collection of AGO item templates
 * @return The ids of the source templates in build order, which is not necessarily the same
 * as the build order used to create the template Solution
 */
export function _reconstructBuildOrderIds(
  templates: IItemTemplate[]
): string[] {
  const buildOrdering: IBuildOrdering = dependencies.topologicallySortItems(
    templates
  );
  return buildOrdering.buildOrder;
}

/**
 * Removes a list of items.
 *
 * @param itemIds List of ids of items to remove
 * @param authentication Credentials for the request
 * @param percentDone Percent done in range 0 to 100
 * @param progressPercentStep Amount that percentDone changes for each item deleted
 * @param deleteOptions Reporting options
 * @param allItemsSuccessfullyDeleted Current state of all items being deleted
 * @return Promise that will resolve with true if all of the items in the list were successfully deleted
 */
export function _removeItems(
  itemIds: string[],
  authentication: UserSession,
  percentDone: number,
  progressPercentStep: number,
  deleteOptions: IDeleteSolutionOptions = {},
  allItemsSuccessfullyDeleted = true
): Promise<boolean> {
  const itemToDelete = itemIds.shift();
  if (itemToDelete) {
    // Remove any delete protection on item
    return portal
      .unprotectItem({ id: itemToDelete, authentication: authentication })
      .then(() => {
        // Delete the item
        return restHelpers.removeItem(itemToDelete, authentication);
      })
      .then(result => {
        if (!result.success) {
          throw new Error("Failed to delete item");
        }
        _reportProgress(
          (percentDone += progressPercentStep),
          deleteOptions,
          itemToDelete,
          EItemProgressStatus.Finished
        );

        // On to next item in list
        return _removeItems(
          itemIds,
          authentication,
          percentDone,
          progressPercentStep,
          deleteOptions,
          allItemsSuccessfullyDeleted
        );
      })
      .catch(error => {
        let stillAllItemsSuccessfullyDeleted = true;
        const errorMessage = error.error?.message || error.message;
        if (
          errorMessage &&
          errorMessage.includes("Item does not exist or is inaccessible")
        ) {
          // Filter out errors where the item doesn't exist, such as from a previous delete attempt
          _reportProgress(
            (percentDone += progressPercentStep),
            deleteOptions,
            itemToDelete,
            EItemProgressStatus.Ignored
          );
        } else {
          // Otherwise, we have a real delete error
          _reportProgress(
            (percentDone += progressPercentStep),
            deleteOptions,
            itemToDelete,
            EItemProgressStatus.Failed
          );
          stillAllItemsSuccessfullyDeleted = false;
        }
        return _removeItems(
          itemIds,
          authentication,
          percentDone,
          progressPercentStep,
          deleteOptions,
          stillAllItemsSuccessfullyDeleted
        );
      });
  } else {
    return Promise.resolve(allItemsSuccessfullyDeleted);
  }
}

/**
 * Reports progress as specified via options.
 *
 * @param percentDone Percent done in range 0 to 100
 * @param deleteOptions Reporting options
 * @param deletedItemId Id of item deleted
 */
export function _reportProgress(
  percentDone: number,
  deleteOptions: IDeleteSolutionOptions,
  deletedItemId = "",
  status = EItemProgressStatus.Started
): void {
  const iPercentDone = Math.round(percentDone);

  /* istanbul ignore else */
  if (deleteOptions.progressCallback) {
    deleteOptions.progressCallback(iPercentDone, deleteOptions.jobId, {
      event: "",
      data: deletedItemId
    });
  }

  /* istanbul ignore else */
  if (deleteOptions.consoleProgress) {
    console.log(
      Date.now(),
      deletedItemId,
      deleteOptions.jobId ?? "",
      SItemProgressStatus[status],
      iPercentDone + "%"
    );
  }
}