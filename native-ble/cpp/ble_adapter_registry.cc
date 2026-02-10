#include "ble_adapter.h"

// Define static registry
std::unordered_map<std::string, BLEAdapter *> BLEAdapter::adapters_;

BLEAdapter *BLEAdapter::GetAdapter(const std::string &id)
{
  auto it = adapters_.find(id);
  if (it == adapters_.end())
    return nullptr;
  return it->second;
}

// Destructor: ensure adapter is unregistered from global registry
BLEAdapter::~BLEAdapter()
{
  if (!adapterId_.empty())
  {
    auto it = adapters_.find(adapterId_);
    if (it != adapters_.end() && it->second == this)
    {
      adapters_.erase(it);
    }
  }
}
